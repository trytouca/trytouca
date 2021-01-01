/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/detail/coptions.hpp"
#include "weasel/devkit/platform.hpp"
#include <climits>

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

bool verror(fmt::string_view format, fmt::format_args args)
{
    fmt::vprint(stderr, format, args);
    return false;
}

template <typename Format, typename... Args>
bool error(const Format& format, Args&&... args)
{
    return verror(format, fmt::make_args_checked<Args...>(format, args...));
}

/**
 *
 */
bool weasel::COptions::parse(const std::unordered_map<std::string, std::string>& opts)
{
    // initialize provided configuration parameters and reject unsupported ones

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
            return error("unknown parameter \"{}\"", kvp.first);
        }
        keys.at(kvp.first)(kvp.second);
    }

    // populate API key if it is set as environmnet variable.
    // the implementation below ensures that `api-key` as environment variable
    // takes precedence over the specified configuration parameter.

    const auto env_value = std::getenv("WEASEL_API_KEY");
    if (env_value != nullptr)
    {
        api_key = env_value;
    }

    // associate a name to each string-based configuration parameter

    const std::unordered_map<std::string, std::string&> params = {
        { "team", team },
        { "suite", suite },
        { "revision", revision },
        { "api-key", api_key },
        { "api-url", api_url }
    };

    // if `api-url` is given in long format, parse `team` and `suite`
    // from its path.

    if (!api_url.empty())
    {
        const ApiUrl apiUrl(api_url);
        _api_root = apiUrl.root;
        for (const auto& param: { "team", "suite", "revision" })
        {
            if (!apiUrl.slugs.count(param) || apiUrl.slugs.at(param).empty())
            {
                continue;
            }
            if (!params.at(param).empty() && params.at(param) != apiUrl.slugs.at(param))
            {
                return error("{0} specified in apiUrl has conflict with {0} configuration parameter", param);
            }
            params.at(param) = apiUrl.slugs.at(param);
        }
    }

    // check that the set of available configuration parameters includes
    // the bare minimum required parameters.

    for (const auto& param: { "team", "suite", "revision" })
    {
        if (params.at(param).empty())
        {
            return error("required configuration parameter \"{}\" is missing", param);
        }
    }

    // if `api_key` and `api_url` are not provided, assume user does
    // not intend to submit results in which case we are done.

    if (!handshake)
    {
        return true;
    }

    // otherwise, check that all necessary config params are provided.

    for (const auto& param: { "api-key", "api-url" })
    {
        if (params.at(param).empty())
        {
            return error("required configuration parameter \"{}\" is missing", param);
        }
    }

    // perform authentication to Weasel Platform using the provided
    // API key and obtain API token for posting results.

    weasel::ApiConnector apiConnector({ _api_root, team, suite, revision });
    _api_token = apiConnector.authenticate(api_key);
    if (_api_token.empty())
    {
        return error("failed to authenticate to the weasel platform");
    }

    return true;
}
