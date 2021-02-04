/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/detail/client.hpp"
#include "rapidjson/document.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"
#include "weasel/devkit/filesystem.hpp"
#include "weasel/devkit/platform.hpp"
#include "weasel/devkit/resultfile.hpp"
#include "weasel/devkit/utils.hpp"
#include "weasel/impl/weasel_generated.h"
#include <fstream>
#include <sstream>

namespace weasel {

    using func_t = std::function<void(const std::string&)>;

    /**
     *
     */
    template <typename T>
    func_t parse_member(T& member);

    /**
     *
     */
    template <>
    func_t parse_member(std::string& member)
    {
        return [&member](const std::string& value) {
            member = value;
        };
    }

    /**
     *
     */
    template <>
    func_t parse_member(bool& member)
    {
        return [&member](const std::string& value) {
            member = value != "false";
        };
    }

    /**
     *
     */
    template <>
    func_t parse_member(unsigned long& member)
    {
        return [&member](const std::string& value) {
            const auto out = std::strtoul(value.c_str(), nullptr, 10);
            if (out != 0 && out != ULONG_MAX) {
                member = out;
            }
        };
    }

    template <>
    func_t parse_member(weasel::ConcurrencyMode& member)
    {
        return [&member](const std::string& value) {
            member = value == "per-thread" ? weasel::ConcurrencyMode::PerThread : weasel::ConcurrencyMode::AllThreads;
        };
    }

    /**
     *
     */
    bool ClientImpl::configure(const ClientImpl::OptionsMap& opts)
    {
        _opts.parse_error.clear();

        // initialize provided configuration parameters and reject unsupported ones

        std::unordered_map<std::string, std::function<void(const std::string&)>> parsers;
        parsers.emplace("team", parse_member(_opts.team));
        parsers.emplace("suite", parse_member(_opts.suite));
        parsers.emplace("version", parse_member(_opts.revision));
        parsers.emplace("api-key", parse_member(_opts.api_key));
        parsers.emplace("api-url", parse_member(_opts.api_url));
        parsers.emplace("handshake", parse_member(_opts.handshake));
        parsers.emplace("post-testcases", parse_member(_opts.post_max_cases));
        parsers.emplace("post-maxretries", parse_member(_opts.post_max_retries));
        parsers.emplace("concurrency-mode", parse_member(_opts.case_declaration));

        for (const auto& kvp : opts) {
            if (!parsers.count(kvp.first)) {
                _opts.parse_error = weasel::format("unknown parameter \"{}\"", kvp.first);
                return false;
            }
            parsers.at(kvp.first)(kvp.second);
        }

        // populate API key if it is set as environmnet variable.
        // the implementation below ensures that `api-key` as environment variable
        // takes precedence over the specified configuration parameter.

        const auto env_value = std::getenv("WEASEL_API_KEY");
        if (env_value != nullptr) {
            _opts.api_key = env_value;
        }

        // associate a name to each string-based configuration parameter

        const std::unordered_map<std::string, std::string&> params = {
            { "team", _opts.team },
            { "suite", _opts.suite },
            { "version", _opts.revision },
            { "api-key", _opts.api_key },
            { "api-url", _opts.api_url }
        };

        // if `api-url` is given in long format, parse `team`, `suite`, and
        // `version` from its path.

        if (!_opts.api_url.empty()) {
            const ApiUrl apiUrl(_opts.api_url);
            for (const auto& param : { "team", "suite", "version" }) {
                if (!apiUrl.slugs.count(param) || apiUrl.slugs.at(param).empty()) {
                    continue;
                }
                if (!params.at(param).empty() && params.at(param) != apiUrl.slugs.at(param)) {
                    _opts.parse_error = fmt::format("{0} specified in apiUrl has conflict with {0} configuration parameter", param);
                    return false;
                }
                params.at(param) = apiUrl.slugs.at(param);
            }
        }

        // check that the set of available configuration parameters includes
        // the bare minimum required parameters.

        for (const auto& param : { "team", "suite", "version" }) {
            if (params.at(param).empty()) {
                _opts.parse_error = fmt::format("required configuration parameter \"{}\" is missing", param);
                return false;
            }
        }

        // if `api_key` and `api_url` are not provided, assume user does
        // not intend to submit results in which case we are done.

        if (!_opts.handshake) {
            _configured = true;
            return true;
        }

        // otherwise, check that all necessary config params are provided.

        for (const auto& param : { "api-key", "api-url" }) {
            if (params.at(param).empty()) {
                _opts.parse_error = fmt::format("required configuration parameter \"{}\" is missing", param);
                return false;
            }
        }

        // perform authentication to Weasel Platform using the provided
        // API key and obtain API token for posting results.

        _platform = std::unique_ptr<PlatformV2>(new PlatformV2(
            _opts.api_root, _opts.team, _opts.suite, _opts.revision));
        if (!_platform->auth(_opts.api_key)) {
            _opts.parse_error = _platform->get_error();
            return false;
        }

        _configured = true;
        return true;
    }

    /**
     *
     */
    bool ClientImpl::configure_by_file(const weasel::filesystem::path& path)
    {
        // check that specified path leads to an existing regular file on disk

        if (!weasel::filesystem::is_regular_file(path)) {
            _opts.parse_error = "configuration file is missing";
            return false;
        }

        // load content of configuration file into memory

        std::ifstream ifs(path.string());
        std::stringstream ss;
        ss << ifs.rdbuf();

        // attempt to parse content of configuration file

        rapidjson::Document rjDoc;
        rjDoc.Parse(ss.str());

        // check that configuration file has a top-level weasel section

        if (rjDoc.HasParseError() || !rjDoc.IsObject()
            || !rjDoc.HasMember("weasel") || !rjDoc["weasel"].IsObject()) {
            _opts.parse_error = "configuration file is not valid";
            return false;
        }

        // populate an OptionsMap with the value of configuration parameters
        // specified in the JSON file.

        OptionsMap opts;

        // parse configuration parameters whose value may be specified as string

        const auto& strKeys = {
            "api-key", "api-url", "team",
            "suite", "version", "handshake",
            "post-testcases", "post-maxretries", "concurrency-mode"
        };

        const auto& rjObj = rjDoc["weasel"];
        for (const auto& key : strKeys) {
            if (rjObj.HasMember(key) && rjObj[key].IsString()) {
                opts.emplace(key, rjObj[key].GetString());
            }
        }

        // parse configuration parameters whose value may be specified as integer

        const auto& intKeys = { "post-maxretries", "post-testcases" };
        for (const auto& key : intKeys) {
            if (rjObj.HasMember(key) && rjObj[key].IsUint()) {
                opts.emplace(key, std::to_string(rjObj[key].GetUint()));
            }
        }

        return configure(opts);
    }

    /**
     *
     */
    void ClientImpl::add_logger(std::shared_ptr<logger> logger)
    {
        _loggers.push_back(logger);
    }

    /**
     *
     */
    std::shared_ptr<weasel::Testcase> ClientImpl::testcase(const std::string& name)
    {
        if (!_configured) {
            return nullptr;
        }
        if (!_testcases.count(name)) {
            const auto& tc = std::make_shared<Testcase>(_opts.team, _opts.suite, _opts.revision, name);
            _testcases.emplace(name, tc);
        }
        _threadMap[std::this_thread::get_id()] = name;
        _mostRecentTestcase = name;
        return _testcases.at(name);
    }

    void ClientImpl::forget_testcase(const std::string& name)
    {
        if (!_testcases.count(name)) {
            const auto err = weasel::format("key `{}` does not exist", name);
            notify_loggers(logger::Level::Warning, err);
            throw std::invalid_argument(err);
        }
        _testcases.at(name)->clear();
        _testcases.erase(name);
    }

    /**
     *
     */
    void ClientImpl::add_result(
        const std::string& key,
        const std::shared_ptr<types::IType>& value)
    {
        if (hasLastTestcase()) {
            _testcases.at(getLastTestcase())->add_result(key, value);
        }
    }

    /**
     *
     */
    void ClientImpl::add_assertion(
        const std::string& key,
        const std::shared_ptr<types::IType>& value)
    {
        if (hasLastTestcase()) {
            _testcases.at(getLastTestcase())->add_assertion(key, value);
        }
    }

    /**
     *
     */
    void ClientImpl::add_array_element(
        const std::string& key,
        const std::shared_ptr<types::IType>& value)
    {
        if (hasLastTestcase()) {
            _testcases.at(getLastTestcase())->add_array_element(key, value);
        }
    }

    /**
     *
     */
    void ClientImpl::add_hit_count(const std::string& key)
    {
        if (hasLastTestcase()) {
            _testcases.at(getLastTestcase())->add_hit_count(key);
        }
    }

    /**
     *
     */
    void ClientImpl::add_metric(const std::string& key, const unsigned duration)
    {
        if (hasLastTestcase()) {
            _testcases.at(getLastTestcase())->add_metric(key, duration);
        }
    }

    /**
     *
     */
    void ClientImpl::start_timer(const std::string& key)
    {
        if (hasLastTestcase()) {
            _testcases.at(getLastTestcase())->tic(key);
        }
    }

    /**
     *
     */
    void ClientImpl::stop_timer(const std::string& key)
    {
        if (hasLastTestcase()) {
            _testcases.at(getLastTestcase())->toc(key);
        }
    }

    /**
     *
     */
    void ClientImpl::save(
        const weasel::filesystem::path& path,
        const std::vector<std::string>& testcases,
        const DataFormat format,
        const bool overwrite) const
    {
        if (weasel::filesystem::exists(path) && !overwrite) {
            throw std::invalid_argument("file already exists");
        }

        auto tcs = testcases;
        if (tcs.empty()) {
            std::transform(_testcases.begin(), _testcases.end(), std::back_inserter(tcs), [](const ElementsMap::value_type& kvp) { return kvp.first; });
        }

        const auto parentPath = weasel::filesystem::absolute(weasel::filesystem::path(path).parent_path());
        if (!weasel::filesystem::exists(parentPath.string()) && !weasel::filesystem::create_directories(parentPath)) {
            throw std::invalid_argument(weasel::format("failed to save content to disk: failed to create directory: {}", parentPath.string()));
        }

        switch (format) {
        case DataFormat::JSON:
            save_json(path, tcs);
            break;
        case DataFormat::FBS:
            save_flatbuffers(path, tcs);
            break;
        default:
            throw std::invalid_argument("saving in given format not supported");
        }
    }

    /**
     *
     */
    bool ClientImpl::post() const
    {
        // check that client is configured to submit test results

        if (!_platform) {
            notify_loggers(logger::Level::Error, "client is not configured to contact weasel platform");
            return false;
        }
        if (!_platform->has_token()) {
            notify_loggers(logger::Level::Error, "client is not authenticated to the weasel platform");
            return false;
        }

        auto ret = true;
        // we should only post testcases that we have not posted yet
        // or those that have changed since we last posted them.
        std::vector<std::string> testcases;
        for (const auto& tc : _testcases) {
            if (!tc.second->_posted) {
                testcases.emplace_back(tc.first);
            }
        }
        // group multiple testcases together according to `_postMaxTestcases`
        // configuration parameter and post each group separately in
        // flatbuffers format.
        for (auto it = testcases.begin(); it != testcases.end();) {
            const auto& tail = it + std::min(static_cast<ptrdiff_t>(_opts.post_max_cases), std::distance(it, testcases.end()));
            std::vector<std::string> batch(it, tail);
            // attempt to post results for this group of testcases.
            // currently we only support posting data in flatbuffers format.
            const auto isPosted = post_flatbuffers(batch);
            it = tail;
            if (!isPosted) {
                notify_loggers(
                    logger::Level::Error,
                    "failed to post test results for a group of testcases");
                ret = false;
                continue;
            }
            for (const auto& tc : batch) {
                _testcases.at(tc)->_posted = true;
            }
        }
        return ret;
    }

    /**
     *
     */
    bool ClientImpl::seal() const
    {
        if (!_platform) {
            notify_loggers(logger::Level::Error, "client is not configured to contact weasel platform");
            return false;
        }
        if (!_platform->has_token()) {
            notify_loggers(logger::Level::Error, "client is not authenticated to the weasel platform");
            return false;
        }
        if (!_platform->seal()) {
            notify_loggers(logger::Level::Warning, _platform->get_error());
            return false;
        }
        return true;
    }

    /**
     *
     */
    bool ClientImpl::hasLastTestcase() const
    {
        // if client is not configured, report that no testcase has been
        // declared. this behavior renders calls to other data capturing
        // functions as no-op which is helpful in production environments
        // where `configure` is expected to never be called.

        if (!_configured) {
            return false;
        }

        // If client is configured, check whether testcase declaration is set as
        // "shared" in which case report the most recently declared testcase.

        if (_opts.case_declaration == weasel::ConcurrencyMode::AllThreads) {
            return !_mostRecentTestcase.empty();
        }

        // If testcase declaration is "thread-specific", check if this thread
        // has declared any testcase before.

        return _threadMap.count(std::this_thread::get_id());
    }

    /**
     *
     */
    std::string ClientImpl::getLastTestcase() const
    {
        // We do not expect this function to be called without calling
        // `hasLastTestcase` first.

        if (!hasLastTestcase()) {
            throw std::logic_error("testcase not declared");
        }

        // If client is configured, check whether testcase declaration is set as
        // "shared" in which case report the name of the most recently declared
        // testcase.

        if (_opts.case_declaration == weasel::ConcurrencyMode::AllThreads) {
            return _mostRecentTestcase;
        }

        // If testcase declaration is "thread-specific", report the most recent
        // testcase declared by this thread.

        return _threadMap.at(std::this_thread::get_id());
    }

    /**
     *
     */
    void ClientImpl::save_flatbuffers(
        const weasel::filesystem::path& path,
        const std::vector<std::string>& names) const
    {
        std::vector<Testcase> tcs;
        tcs.reserve(names.size());
        for (const auto& name : names) {
            tcs.emplace_back(*_testcases.at(name));
        }
        ResultFile rfile(path);
        rfile.save(tcs);
    }

    /**
     *
     */
    bool ClientImpl::post_flatbuffers(
        const std::vector<std::string>& names) const
    {
        std::vector<Testcase> tcs;
        tcs.reserve(names.size());
        for (const auto& name : names) {
            tcs.emplace_back(*_testcases.at(name));
        }
        const auto& buffer = Testcase::serialize(tcs);
        std::string content((const char*)buffer.data(), buffer.size());
        const auto& errors = _platform->submit(content, _opts.post_max_retries);
        for (const auto& err : errors) {
            notify_loggers(logger::Level::Warning, err);
        }
        return errors.empty();
    }

    /**
     *
     */
    std::string ClientImpl::make_json(
        const std::vector<std::string>& testcases) const
    {
        rapidjson::Document doc(rapidjson::kArrayType);
        rapidjson::Document::AllocatorType& allocator = doc.GetAllocator();

        for (const auto& testcase : testcases) {
            doc.PushBack(_testcases.at(testcase)->json(allocator), allocator);
        }

        rapidjson::StringBuffer strbuf;
        rapidjson::Writer<rapidjson::StringBuffer> writer(strbuf);
        writer.SetMaxDecimalPlaces(3);
        doc.Accept(writer);

        return strbuf.GetString();
    }

    /**
     *
     */
    void ClientImpl::save_json(
        const weasel::filesystem::path& path,
        const std::vector<std::string>& testcases) const
    {
        const auto& content = make_json(testcases);
        try {
            std::ofstream ofs(path);
            ofs << content;
            ofs.close();
        } catch (const std::exception& ex) {
            throw std::invalid_argument(
                weasel::format("failed to save content to disk: {}", ex.what()));
        }
    }

    /**
     *
     */
    void ClientImpl::notify_loggers(
        const logger::Level severity,
        const std::string& msg) const
    {
        for (const auto& logger : _loggers) {
            logger->log(severity, msg);
        }
    }

} // namespace weasel
