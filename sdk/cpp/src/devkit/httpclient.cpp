/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/devkit/httpclient.hpp"
#include "fmt/core.h"
#include "httplib.h"

namespace weasel {

    /**
     *
     */
    HttpClient::HttpClient(const std::string& root)
        : _root(root)
    {
    }

    /**
     *
     */
    HttpClient::Response HttpClient::getJson(
        const std::string& route,
        const std::string& apiToken)
    {
        httplib::Client cli(_root.c_str());
        httplib::Headers headers = {
            { "Accept-Charset", "utf-8" },
            { "Accept", "application/json" },
            { "User-Agent", "weasel-client-cpp/1.2.1" }
        };
        if (!apiToken.empty()) {
            headers.emplace("Authorization", fmt::format("Bearer {}", apiToken));
        }
        const auto result = cli.Get(route.c_str(), headers);
        return { result.value().status, result.value().body };
    }

    /**
     *
     */
    HttpClient::Response HttpClient::postJson(
        const std::string& route,
        const std::string& content,
        const std::string& apiToken)
    {
        httplib::Client cli(_root.c_str());
        httplib::Headers headers = {
            { "Accept-Charset", "utf-8" },
            { "Accept", "application/json" },
            { "User-Agent", "weasel-client-cpp/1.2.1" }
        };
        if (!apiToken.empty()) {
            headers.emplace("Authorization", fmt::format("Bearer {}", apiToken));
        }
        const auto result = cli.Post(route.c_str(), headers, content, "application/json");
        return { result.value().status, result.value().body };
    }

    /**
     *
     */
    HttpClient::Response HttpClient::patchJson(
        const std::string& route,
        const std::string& content,
        const std::string& apiToken)
    {
        httplib::Client cli(_root.c_str());
        httplib::Headers headers = {
            { "Accept-Charset", "utf-8" },
            { "Accept", "application/json" },
            { "User-Agent", "weasel-client-cpp/1.2.1" }
        };
        if (!apiToken.empty()) {
            headers.emplace("Authorization", fmt::format("Bearer {}", apiToken));
        }
        const auto result = cli.Patch(route.c_str(), headers, content, "application/json");
        return { result.value().status, result.value().body };
    }

    /**
     *
     */
    HttpClient::Response HttpClient::postBinary(
        const std::string& route,
        const std::string& content,
        const std::string& apiToken)
    {
        httplib::Client cli(_root.c_str());
        httplib::Headers headers = {
            { "Accept-Charset", "utf-8" },
            { "Accept", "application/json" },
            { "User-Agent", "weasel-client-cpp/1.2.1" }
        };
        if (!apiToken.empty()) {
            headers.emplace("Authorization", fmt::format("Bearer {}", apiToken));
        }
        const auto result = cli.Post(route.c_str(), headers, content, "application/octet-stream");
        return { result.value().status, result.value().body };
    }

} // namespace weasel
