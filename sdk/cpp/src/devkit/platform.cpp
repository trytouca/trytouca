/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/devkit/platform.hpp"
#include "httplib.h"
#include "rapidjson/document.h"
#include "weasel/devkit/utils.hpp"
#include <sstream>

namespace weasel {

    /**
     *
     */
    ApiUrl::ApiUrl(const std::string& api_url)
    {
        root = api_url.substr(0, api_url.find_last_of('@'));
        if (root.back() == '/') {
            root.pop_back();
        }
        if (std::string::npos == api_url.find_last_of('@')) {
            slugs.emplace("team", "");
            slugs.emplace("suite", "");
            slugs.emplace("version", "");
            return;
        }
        std::istringstream iss(api_url.substr(api_url.find_last_of('@') + 1));
        std::vector<std::string> items;
        std::string item;
        while (std::getline(iss, item, '/')) {
            if (!item.empty()) {
                items.emplace_back(item);
            }
        }
        while (items.size() < 3) {
            items.emplace_back("");
        }
        slugs["team"] = items.at(0);
        slugs["suite"] = items.at(1);
        slugs["version"] = items.at(2);
    }

    /**
     *
     */
    HttpV2::HttpV2(const std::string& root)
        : _root(root)
    {
    }

    /**
     *
     */
    void HttpV2::set_token(const std::string& token)
    {
        _token = token;
    }

    /**
     *
     */
    ResponseV2 HttpV2::get(const std::string& route) const
    {
        httplib::Client cli(_root.c_str());
        if (!_token.empty()) {
            cli.set_bearer_token_auth(_token.c_str());
        }
        httplib::Headers headers = {
            { "Accept-Charset", "utf-8" },
            { "Accept", "application/json" },
            { "User-Agent", "weasel-client-cpp/1.2.1" }
        };
        const auto result = cli.Get(route.c_str(), headers);
        return { result.value().status, result.value().body };
    }

    /**
     *
     */
    ResponseV2 HttpV2::patch(const std::string& route, const std::string& body) const
    {
        httplib::Client cli(_root.c_str());
        if (!_token.empty()) {
            cli.set_bearer_token_auth(_token.c_str());
        }
        httplib::Headers headers = {
            { "Accept-Charset", "utf-8" },
            { "Accept", "application/json" },
            { "User-Agent", "weasel-client-cpp/1.2.1" }
        };
        const auto result = cli.Patch(route.c_str(), headers, body, "application/json");
        return { result.value().status, result.value().body };
    }

    /**
     *
     */
    ResponseV2 HttpV2::post(const std::string& route, const std::string& body) const
    {
        httplib::Client cli(_root.c_str());
        if (!_token.empty()) {
            cli.set_bearer_token_auth(_token.c_str());
        }
        httplib::Headers headers = {
            { "Accept-Charset", "utf-8" },
            { "Accept", "application/json" },
            { "User-Agent", "weasel-client-cpp/1.2.1" }
        };
        const auto result = cli.Post(route.c_str(), headers, body, "application/json");
        return { result.value().status, result.value().body };
    }

    /**
     *
     */
    ResponseV2 HttpV2::binary(const std::string& route, const std::string& content) const
    {
        httplib::Client cli(_root.c_str());
        if (!_token.empty()) {
            cli.set_bearer_token_auth(_token.c_str());
        }
        httplib::Headers headers = {
            { "Accept-Charset", "utf-8" },
            { "Accept", "application/json" },
            { "User-Agent", "weasel-client-cpp/1.2.1" }
        };
        const auto result = cli.Post(route.c_str(), headers, content, "application/octet-stream");
        return { result.value().status, result.value().body };
    }

    /**
     *
     */
    PlatformV2::PlatformV2(
        const std::string& root, const std::string& team,
        const std::string& suite, const std::string& revision)
        : _http(root)
        , _team(team)
        , _suite(suite)
        , _revision(revision)
    {
    }

    /**
     * Perform handshake with Weasel Platform to ensure that it is ready
     * to serve further requests and queries. Parse response from Weasel
     * Platform as a precaution.
     *
     * This implementation is verbose for historical reasons. The inline
     * comments in each condition used to be log events. Since this function
     * is intended to be moved outside the client library, we plan to
     * resurrect the log events and hence choose to keep the implementation
     * verbose.
     */
    bool PlatformV2::handshake() const
    {
        rapidjson::Document doc;

        // performing handshake with Weasel Platform
        const auto response = _http.get("/platform");

        if (response.status == -1) {
            // Weasel Platform appears to be down
            return false;
        }

        if (response.status != 200) {
            // response from Weasel Platform is unexpected
            return false;
        }

        if (doc.Parse<0>(response.body.c_str()).HasParseError()) {
            // failed to parse response from Weasel Platform
            return false;
        }

        if (!doc.HasMember("ready") || !doc["ready"].IsBool()) {
            // response from Weasel Platform is ill-formed
            return false;
        }

        if (!doc["ready"].GetBool()) {
            // Weasel Platform is not ready
            return false;
        }

        // established connection with Weasel Platform
        return true;
    }

    /**
     * Submit authentication request. If Platform accepts this request, parse
     * the response to extract the API Token issued by Weasel Platform.
     */
    bool PlatformV2::auth(const std::string& apiKey)
    {
        rapidjson::Document doc;
        const auto content = weasel::format("{{\"key\": \"{}\"}}", apiKey);
        const auto response = _http.post("/client/signin", content);

        // check status of response from Weasel Platform

        if (response.status != 200) {
            throw std::runtime_error(weasel::format("platform authentication failed: {}", response.status));
        }

        // Parse response from Weasel Platform

        if (doc.Parse<0>(response.body.c_str()).HasParseError()) {
            throw std::runtime_error("failed to parse platform response");
        }

        // extract API Token issued by Weasel Platform

        if (!doc.HasMember("token") || !doc["token"].IsString()) {
            throw std::runtime_error("platform response malformed");
        }

        _http.set_token(doc["token"].GetString());
        _is_auth = true;
        return true;
    }

    /**
     *
     */
    std::vector<std::string> PlatformV2::elements() const
    {
        const auto& route = weasel::format("/element/{}/{}", _team, _suite);
        const auto response = _http.get(route);

        // check status of response from Weasel Platform

        if (response.status != 200) {
            throw std::runtime_error("received unexpected platform response");
        }

        // parse response from Weasel Platform

        rapidjson::Document doc;
        if (doc.Parse<0>(response.body.c_str()).HasParseError()) {
            throw std::runtime_error("failed to parse platform response");
        }

        // extract list of element slugs in the response from Weasel Platform

        std::vector<std::string> elements;
        for (const auto& rjElement : doc.GetArray()) {
            elements.emplace_back(rjElement["name"].GetString());
        }
        return elements;
    }

    /**
     *
     */
    std::vector<std::string> PlatformV2::submit(
        const std::string& content,
        const unsigned max_retries) const
    {
        std::vector<std::string> errors;
        for (auto i = 0ul; i < max_retries; ++i) {
            const auto response = _http.binary("/client/submit", content);
            if (response.status == 204) {
                return {};
            }
            errors.emplace_back(weasel::format(
                "failed to post testresults for a group of testcases ({}/{})",
                i + 1,
                max_retries));
        }
        errors.emplace_back("giving up on submitting testresults");
        return errors;
    }

    /**
     *
     */
    bool PlatformV2::seal() const
    {
        const auto route = fmt::format("/batch/{}/{}/{}/seal2",
            _team, _suite, _revision);
        const auto response = _http.post(route);
        return response.status == 204;
    }

    /**
     *
     */
    std::string PlatformV2::get_error() const
    {
        return _error;
    }

} // namespace weasel
