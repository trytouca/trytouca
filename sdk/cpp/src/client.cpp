/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/detail/client.hpp"
#include "boost/filesystem.hpp"
#include "rapidjson/document.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"
#include "weasel/devkit/platform.hpp"
#include "weasel/devkit/resultfile.hpp"
#include "weasel/devkit/utils.hpp"
#include "weasel/impl/weasel_generated.h"

namespace weasel {

    /**
     *
     */
    using co = weasel::ConfigOption;

    /**
     *
     */
    ClientImpl::ClientImpl()
        : _opts({ { co::api_key, "api-key" },
                  { co::api_url, "api-url" },
                  { co::case_declaration, "testcase-declaration-mode" },
                  { co::handshake, "handshake" },
                  { co::post_max_cases, "post-testcases" },
                  { co::post_max_retries, "post-maxretries" },
                  { co::team, "team" },
                  { co::suite, "suite" },
                  { co::version, "version" } })
    {
    }

    /**
     * Enables convenient unit testing of `ClientImpl::configure` function.
     */
    const weasel::Options<co>& ClientImpl::options() const
    {
        return _opts;
    }

    /**
     *
     */
    void ClientImpl::configure(const ClientImpl::OptionsMap& opts)
    {
        // for better user experience, we allow users to provide configuration
        // parameters as a map of strings. For clarity, readability and to
        // reduce chance of errors, we store configuration parameters as
        // values of a known enum class.

        // pre-populate config params with default values

        _opts.add(co::case_declaration, "all-threads");
        _opts.add(co::post_max_retries, "2");
        _opts.add(co::post_max_cases, "10");
        _opts.add(co::handshake, "true");

        // set config params provided by the user

        for (const auto& opt : opts)
        {
            if (!_opts.hasName(opt.first))
            {
                throw std::invalid_argument(
                    weasel::format("unknown parameter {}", opt.first));
            }
            _opts.add(_opts.toKey(opt.first), opt.second);
        }

        // some configuration parameters are expected to be numeric

        for (const auto& opt : { co::post_max_cases, co::post_max_retries })
        {
            try
            {
                _opts.get<unsigned short>(opt);
            }
            catch (const boost::bad_lexical_cast& ex)
            {
                std::ignore = ex;
                throw std::invalid_argument(weasel::format(
                    "parameter {} must be a number", _opts.toName(opt)));
            }
        }

        // Populate API key if it is set as environmnet variable.
        // The implementation below ensures that `api-key` as
        // configuration parameter takes precedence over environment
        // variable.

        if (!_opts.has(co::api_key) || _opts.get(co::api_key).empty())
        {
            const auto apiKey = std::getenv("WEASEL_API_KEY");
            if (apiKey != nullptr)
            {
                _opts.add(co::api_key, apiKey);
            }
        }

        // if `api-url` is given in long format, parse `team` and `suite`
        // from its path.

        if (_opts.has(co::api_url))
        {
            const ApiUrl apiUrl(_opts.get(co::api_url));
            _opts.add(co::api_root, apiUrl.root);
            for (const auto& opt : { co::team, co::suite, co::version })
            {
                const auto name = _opts.toName(opt);
                if (!apiUrl.slugs.count(name) || apiUrl.slugs.at(name).empty())
                {
                    continue;
                }
                if (_opts.has(opt) && _opts.get(opt) != apiUrl.slugs.at(name))
                {
                    throw std::invalid_argument(weasel::format(
                        "{0} specified in apiUrl has conflict with "
                        "{0} parameter",
                        name));
                }
                _opts.add(opt, apiUrl.slugs.at(name));
            }
        }

        // check that the set of available configuration parameters
        // includes parameters required by the application.

        validate({ co::version, co::suite, co::team });

        // if `api_key` and `api_url` are not provided, assume user does
        // not intend to submit results in which case we are done.

        if (_opts.get(co::handshake) == "false"
            || (!_opts.has(co::api_key) && !_opts.has(co::api_url)))
        {
            return;
        }

        // otherwise, check that all necessary config params are provided.

        validate({ co::api_key, co::api_url });

        // Perform authentication to Weasel Platform using the provided
        // API key and obtain API token for posting results.

        ApiConnector apiConnector({ _opts.get(co::api_root),
                                    _opts.get(co::team),
                                    _opts.get(co::suite),
                                    _opts.get(co::version) });
        const auto& token = apiConnector.authenticate(_opts.get(co::api_key));
        if (token.empty())
        {
            throw std::runtime_error(
                "failed to authenticate to Weasel Platform");
        }
        _opts.add(co::api_token, token);
    }

    /**
     *
     */
    void ClientImpl::configureByFile(const weasel::path& path)
    {
        if (!weasel::filesystem::is_regular_file(path))
        {
            throw std::invalid_argument("configuration file is missing");
        }
        std::ifstream ifs(path);
        std::stringstream ss;
        ss << ifs.rdbuf();
        const auto& opts = parseOptionsMap(ss.str());
        return configure(opts);
    }

    /**
     *
     */
    ClientImpl::OptionsMap ClientImpl::parseOptionsMap(
        const std::string& json) const
    {
        OptionsMap opts;
        const auto& strKeys = {
            "api-key", "api-url", "team",
            "suite", "version", "handshake",
            "post-testcases", "post-maxretries", "testcase-declaration-mode"
        };

        rapidjson::Document rjDoc;
        rjDoc.Parse(json);
        if (rjDoc.HasParseError() || !rjDoc.IsObject()
            || !rjDoc.HasMember("weasel") || !rjDoc["weasel"].IsObject())
        {
            throw std::invalid_argument("configuration file is not valid");
        }
        const auto& rjObj = rjDoc["weasel"];
        for (const auto& key : strKeys)
        {
            if (rjObj.HasMember(key) && rjObj[key].IsString())
            {
                opts.emplace(key, rjObj[key].GetString());
            }
        }
        const auto& intKeys = { "post-maxretries", "post-testcases" };
        for (const auto& key : intKeys)
        {
            if (rjObj.HasMember(key) && rjObj[key].IsUint())
            {
                opts.emplace(key, std::to_string(rjObj[key].GetUint()));
            }
        }
        return opts;
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
        if (_opts.empty())
        {
            return nullptr;
        }
        if (!_testcases.count(name))
        {
            const auto& tc = std::shared_ptr<Testcase>(new Testcase(
                _opts.get(ConfigOption::team),
                _opts.get(ConfigOption::suite),
                _opts.get(ConfigOption::version),
                name));
            _testcases.emplace(name, tc);
        }
        _threadMap[std::this_thread::get_id()] = name;
        _mostRecentTestcase = name;
        return _testcases.at(name);
    }

    void ClientImpl::forget_testcase(const std::string& name)
    {
        if (!_testcases.count(name))
        {
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
        if (hasLastTestcase())
        {
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
        if (hasLastTestcase())
        {
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
        if (hasLastTestcase())
        {
            _testcases.at(getLastTestcase())->add_array_element(key, value);
        }
    }

    /**
     *
     */
    void ClientImpl::add_hit_count(const std::string& key)
    {
        if (hasLastTestcase())
        {
            _testcases.at(getLastTestcase())->add_hit_count(key);
        }
    }

    /**
     *
     */
    void ClientImpl::add_metric(const std::string& key, const unsigned duration)
    {
        if (hasLastTestcase())
        {
            _testcases.at(getLastTestcase())->add_metric(key, duration);
        }
    }

    /**
     *
     */
    void ClientImpl::start_timer(const std::string& key)
    {
        if (hasLastTestcase())
        {
            _testcases.at(getLastTestcase())->tic(key);
        }
    }

    /**
     *
     */
    void ClientImpl::stop_timer(const std::string& key)
    {
        if (hasLastTestcase())
        {
            _testcases.at(getLastTestcase())->toc(key);
        }
    }

    /**
     *
     */
    void ClientImpl::save(
        const weasel::path& path,
        const std::vector<std::string>& testcases,
        const DataFormat format,
        const bool overwrite) const
    {
        if (weasel::filesystem::exists(path) && !overwrite)
        {
            throw std::invalid_argument("file already exists");
        }

        auto tcs = testcases;
        if (tcs.empty())
        {
            std::transform(_testcases.begin(), _testcases.end(), std::back_inserter(tcs), [](const ElementsMap::value_type& kvp) { return kvp.first; });
        }

        const auto parentPath = boost::filesystem::absolute(boost::filesystem::path(path).parent_path());
        if (!weasel::filesystem::exists(parentPath.string()) && !boost::filesystem::create_directories(parentPath))
        {
            throw std::invalid_argument(weasel::format(
                "failed to save content to disk: failed to create directory: "
                "{}",
                parentPath.string()));
        }

        switch (format)
        {
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
        validate({ co::api_key, co::api_url });
        auto ret = true;
        // we should only post testcases that we have not posted yet
        // or those that have changed since we last posted them.
        std::vector<std::string> testcases;
        for (const auto& tc : _testcases)
        {
            if (!tc.second->_posted)
            {
                testcases.emplace_back(tc.first);
            }
        }
        // group multiple testcases together according to `_postMaxTestcases`
        // configuration parameter and post each group separately in
        // flatbuffers format.
        const auto maxCases = _opts.get<unsigned short>(co::post_max_cases);
        for (auto it = testcases.begin(); it != testcases.end();)
        {
            const auto& tail = it
                + std::min(static_cast<ptrdiff_t>(maxCases),
                           std::distance(it, testcases.end()));
            std::vector<std::string> batch(it, tail);
            // attempt to post results for this group of testcases.
            // currently we only support posting data in flatbuffers format.
            const auto isPosted = post_flatbuffers(batch);
            it = tail;
            if (!isPosted)
            {
                notify_loggers(
                    logger::Level::Error,
                    "failed to post test results for a group of testcases");
                ret = false;
                continue;
            }
            for (const auto& tc : batch)
            {
                _testcases.at(tc)->_posted = true;
            }
        }
        return ret;
    }

    /**
     *
     */
    bool ClientImpl::hasLastTestcase() const
    {
        // If client is not configured, report that no testcase has been declared.
        // This behavior renders calls to other logging functions as no-op which
        // is helpful in production environments where `configure` is expected to
        // never be called.

        if (_opts.empty())
        {
            return false;
        }

        // If client is configured, check whether testcase declaration is set as
        // "shared" in which case report the most recently declared testcase.

        if (_opts.get(co::case_declaration) == "all-threads")
        {
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

        if (!hasLastTestcase())
        {
            throw std::logic_error("testcase not declared");
        }

        // If client is configured, check whether testcase declaration is set as
        // "shared" in which case report the name of the most recently declared
        // testcase.

        if (_opts.get(co::case_declaration) == "all-threads")
        {
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
        const weasel::path& path,
        const std::vector<std::string>& names) const
    {
        std::vector<Testcase> tcs;
        tcs.reserve(names.size());
        for (const auto& name : names)
        {
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
        for (const auto& name : names)
        {
            tcs.emplace_back(*_testcases.at(name));
        }
        const auto& buffer = Testcase::serialize(tcs);
        std::string content((const char*)buffer.data(), buffer.size());
        ApiUrl apiUrl { _opts.get(co::api_root),
                        _opts.get(co::team),
                        _opts.get(co::suite),
                        _opts.get(co::version) };
        ApiConnector apiConnector(apiUrl, _opts.get(co::api_token));
        const auto errors = apiConnector.submitResults(
            content, _opts.get<unsigned short>(co::post_max_retries));
        for (const auto& err : errors)
        {
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

        for (const auto& testcase : testcases)
        {
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
        const weasel::path& path,
        const std::vector<std::string>& testcases) const
    {
        const auto& content = make_json(testcases);
        try
        {
            std::ofstream ofs(path);
            ofs << content;
            ofs.close();
        }
        catch (const std::exception& ex)
        {
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
        for (const auto& logger : _loggers)
        {
            logger->log(severity, msg);
        }
    }

    /**
     *
     */
    void ClientImpl::validate(
        const std::initializer_list<ConfigOption>& keys) const
    {
        const auto& missingKeys = _opts.findMissingKeys(keys);
        if (!missingKeys.empty())
        {
            throw std::invalid_argument(weasel::format(
                "required configuration parameter {} is missing",
                _opts.toName(missingKeys.front())));
        }
    }

} // namespace weasel
