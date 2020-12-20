/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "weasel/devkit/options.hpp"
#include "weasel/devkit/testcase.hpp"
#include "weasel/extra/logger.hpp"
#include <thread>

namespace weasel {

    using path = std::string;

    /**
     *
     */
    enum class TestcaseDeclarationMode : unsigned char
    {
        PerThread,
        AllThreads,
    };

    /**
     *
     */
    enum class ConfigOption : unsigned char
    {
        api_key, /**< API Key to authenticate to Weasel Platform */
        api_url, /**< URL to Weasel Platform API */
        version, /**< version of code under test */
        suite, /**< Suite to which results should be submitted */
        team, /**< Team to which this suite belongs */
        post_max_cases, /**< maximum number of testcases whose results
                               may be posted in a single http request */
        post_max_retries, /**< maximum number of attempts to re-submit
                               failed http requests */
        case_declaration, /**< whether testcase declaration should be
                               isolated to each thread */
        handshake, /**< whether client should perform handshake
                               with platform during configuration */
        api_token, /**< API Token issued upon authentication.
                               Internal. Purposely not documented. */
        api_root, /**< API URL in short format.
                               Internal. Purposely not documented. */
    };

    /**
     * @enum weasel::DataFormat
     * @brief describes supported formats for storing testresults to disk
     */
    enum class DataFormat : unsigned char
    {
        FBS, /**< flatbuffers */
        JSON /**< json */
    };

    /**
     * We are exposing this class for convenient unit-testing.
     */
    class WEASEL_CLIENT_API ClientImpl
    {
    public:
        using OptionsMap = std::unordered_map<std::string, std::string>;

        /**
         *
         */
        explicit ClientImpl();

        /**
         *
         */
        const Options<ConfigOption>& options() const;

        /**
         *
         */
        void configure(const OptionsMap& opts);

        /**
         *
         */
        void configureByFile(const weasel::path& path);

        /**
         *
         */
        void add_logger(std::shared_ptr<weasel::logger> logger);

        /**
         *
         */
        std::shared_ptr<Testcase> testcase(const std::string& name);

        /**
         *
         */
        void forget_testcase(const std::string& name);

        /**
         *
         */
        void add_result(
            const std::string& key,
            const std::shared_ptr<types::IType>& value);

        /**
         *
         */
        void add_assertion(
            const std::string& key,
            const std::shared_ptr<types::IType>& value);

        /**
         *
         */
        void add_array_element(
            const std::string& key,
            const std::shared_ptr<types::IType>& value);

        /**
         *
         */
        void add_hit_count(const std::string& key);

        /**
         *
         */
        void add_metric(const std::string& key, const unsigned duration);

        /**
         *
         */
        void start_timer(const std::string& key);

        /**
         *
         */
        void stop_timer(const std::string& key);

        /**
         *
         */
        void save(
            const weasel::path& path,
            const std::vector<std::string>& testcases,
            const DataFormat format,
            const bool overwrite) const;

        /**
         *
         */
        bool post() const;

    private:
        /**
         *
         */
        OptionsMap parseOptionsMap(const std::string& json) const;

        /**
         *
         */
        void validate(const std::initializer_list<ConfigOption>& keys) const;

        /**
         *
         */
        std::string getLastTestcase() const;

        /**
         *
         */
        bool hasLastTestcase() const;

        /**
         *
         */
        std::string make_json(const std::vector<std::string>& testcases) const;

        /**
         *
         */
        void save_json(
            const weasel::path& path,
            const std::vector<std::string>& testcases) const;

        /**
         *
         */
        void save_flatbuffers(
            const weasel::path& path,
            const std::vector<std::string>& testcases) const;

        /**
         *
         */
        bool post_flatbuffers(const std::vector<std::string>& testcases) const;

        /**
         *
         */
        void notify_loggers(
            const weasel::logger::Level severity,
            const std::string& msg) const;

        ElementsMap _testcases;
        std::unordered_map<std::thread::id, std::string> _threadMap;
        std::string _mostRecentTestcase;
        std::vector<std::shared_ptr<weasel::logger>> _loggers;
        Options<ConfigOption> _opts;
    };

} // namespace weasel
