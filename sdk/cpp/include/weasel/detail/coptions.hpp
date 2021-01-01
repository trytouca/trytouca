/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "weasel/lib_api.hpp"
#include <unordered_map>
#include "fmt/printf.h"

namespace weasel {

    enum class ConcurrencyMode : unsigned char
    {
        PerThread,
        AllThreads,
    };

    class WEASEL_CLIENT_API COptions
    {
    public:
        std::string api_key; /**< API Key to authenticate to Weasel Platform */
        std::string api_url; /**< URL to Weasel Platform API */
        std::string team; /**< version of code under test */
        std::string suite; /**< Suite to which results should be submitted */
        std::string revision; /**< Team to which this suite belongs */
        bool handshake = true;
        unsigned long post_max_cases = 10;
        unsigned long post_max_retries = 2;
        ConcurrencyMode case_declaration = ConcurrencyMode::AllThreads;

        bool parse(const std::unordered_map<std::string, std::string>& opts);

    private:
        std::string _api_token;
        std::string _api_root;

        bool validate() const
        {
            for (const auto& member: { team, suite, revision })
            {
                if (member.empty())
                {
                    return false;
                }
            }
            if (handshake)
            {
                for (const auto& member: { api_key, api_url })
                {
                    if (member.empty())
                    {
                        return false;
                    }
                }
            }
            return true;
        }
    };

} // namespace weasel
