/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/detail/coptions.hpp"

using namespace weasel;
using func_t = std::function<void(const std::string&)>;

template <typename T>
func_t parse_member(T& member);

template <>
func_t parse_member(std::string& member) {
    return [&member](const std::string& value) {
        member = value;
    };
}

template <>
func_t parse_member(bool& member) {
    return [&member](const std::string& value) {
        member = value != "false";
    };
}

template <>
func_t parse_member(unsigned long& member)
{
    return [&member](const std::string& value) {
        const auto out = std::strtoul(value.c_str(), nullptr, 10);
        if (out != 0 && out != ULONG_MAX)
        {
            member = out;
        }
    };
}

/**
 *
 */
bool COptions::parse(const std::unordered_map<std::string, std::string>& opts)
{
    std::unordered_map<std::string, std::function<void(const std::string&)>> keys;
    keys.emplace("team", parse_member(team));
    keys.emplace("suite", parse_member(suite));
    keys.emplace("version", parse_member(revision));
    keys.emplace("api-key", parse_member(api_key));
    keys.emplace("api-url", parse_member(api_url));
    keys.emplace("handshake", parse_member(handshake));
    keys.emplace("opts-testcases", parse_member(post_max_cases));
    keys.emplace("opts-maxretries", parse_member(post_max_retries));

    for (const auto& kvp: opts)
    {
        if (!keys.count(kvp.first))
        {
            fmt::print(stderr, "unknown parameter {}", kvp.first);
            return false;
        }
        keys.at(kvp.first)(kvp.second);
    }

    return validate();
}
