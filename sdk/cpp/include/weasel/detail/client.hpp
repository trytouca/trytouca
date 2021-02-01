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
     * @enum weasel::DataFormat
     * @brief describes supported formats for storing testresults to disk
     */
    enum class DataFormat : unsigned char {
        FBS, /**< flatbuffers */
        JSON /**< json */
    };

    /**
     * We are exposing this class for convenient unit-testing.
     */
    class WEASEL_CLIENT_API ClientImpl {
    public:
        using OptionsMap = std::unordered_map<std::string, std::string>;

        /**
         *
         */
        void configure(const ClientImpl::OptionsMap& opts);

        /**
         *
         */
        void configure_by_file(const weasel::filesystem::path& path);

        /**
         *
         */
        inline bool is_configured() const
        {
            return _configured;
        }

        /**
         *
         */
        inline std::string configuration_error() const
        {
            return _opts.parse_error;
        }

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
            const weasel::filesystem::path& path,
            const std::vector<std::string>& testcases,
            const DataFormat format,
            const bool overwrite) const;

        /**
         *
         */
        bool post() const;

        /**
         *
         */
        bool seal() const;

    private:
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
            const weasel::filesystem::path& path,
            const std::vector<std::string>& testcases) const;

        /**
         *
         */
        void save_flatbuffers(
            const weasel::filesystem::path& path,
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

        ClientOptions _opts;
        bool _configured = false;
        ElementsMap _testcases;
        std::string _mostRecentTestcase;
        std::unordered_map<std::thread::id, std::string> _threadMap;
        std::vector<std::shared_ptr<weasel::logger>> _loggers;
    };

} // namespace weasel
