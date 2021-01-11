/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "fmt/core.h"
#include "weasel/devkit/filesystem.hpp"
#include "weasel/lib_api.hpp"
#include <unordered_map>

namespace weasel {

    /**
     *
     */
    enum class ConcurrencyMode : unsigned char {
        PerThread,
        AllThreads
    };

    /**
     *
     */
    struct WEASEL_CLIENT_API ClientOptions {
        std::string api_key; /**< API Key to authenticate to Weasel Platform */
        std::string api_url; /**< URL to Weasel Platform API */
        std::string team; /**< version of code under test */
        std::string suite; /**< Suite to which results should be submitted */
        std::string revision; /**< Team to which this suite belongs */
        bool handshake = true; /**< whether client should perform handshake with platform during configuration */
        unsigned long post_max_cases = 10; /**< maximum number of testcases whose results may be posted in a single http request */
        unsigned long post_max_retries = 2; /**< maximum number of attempts to re-submit failed http requests */
        ConcurrencyMode case_declaration = ConcurrencyMode::AllThreads; /**< whether testcase declaration should be isolated to each thread */

        /* The following member variables are internal and purposely not documented. */

        std::string api_token; /**< API Token issued upon authentication. */
        std::string api_root; /**< API URL in short format. */
        std::string parse_error;

        /**
         *
         */
        bool parse(const std::unordered_map<std::string, std::string>& opts);

        /**
         *
         */
        bool parse_file(const weasel::path& path);

    private:
        /**
         *
         */
        template <typename Format, typename... Args>
        bool error(const Format& format, Args&&... args)
        {
            return verror(format, fmt::make_args_checked<Args...>(format, args...));
        }

        /**
         *
         */
        bool verror(fmt::string_view format, fmt::format_args args);
    };

} // namespace weasel
