/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include <fstream>
#include "weasel/detail/client.hpp"
#include "rapidjson/document.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"
#include "weasel/devkit/filesystem.hpp"
#include "weasel/devkit/platform.hpp"
#include "weasel/devkit/resultfile.hpp"
#include "weasel/devkit/utils.hpp"
#include "weasel/impl/weasel_generated.h"

namespace weasel {

    /**
     *
     */
    void ClientImpl::configure(const ClientImpl::OptionsMap& opts)
    {
        _configured = _opts.parse(opts);
    }

    /**
     *
     */
    void ClientImpl::configure_by_file(const weasel::path& path)
    {
        _configured = _opts.parse_file(path);
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
        const weasel::path& path,
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
        // we will not post data if client is not configured to do so.

        if (_opts.api_key.empty() || _opts.api_url.empty()) {
            throw std::runtime_error("weasel client is not configured to post testresults");
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
        const weasel::path& path,
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
        ApiUrl apiUrl { _opts.api_root, _opts.team, _opts.suite, _opts.revision };
        ApiConnector apiConnector(apiUrl, _opts.api_token);
        const auto errors = apiConnector.submitResults(content, _opts.post_max_retries);
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
        const weasel::path& path,
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
