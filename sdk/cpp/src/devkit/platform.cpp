/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/devkit/platform.hpp"
#include "rapidjson/document.h"

#include "weasel/devkit/httpclient.hpp"
#include "weasel/devkit/utils.hpp"
#include <sstream>

namespace weasel {

    /**
     *
     */
    ApiUrl::ApiUrl(const std::string& apiUrl)
    {
        root = apiUrl.substr(0, apiUrl.find_last_of('@'));
        if (root.back() == '/') {
            root.pop_back();
        }
        if (std::string::npos == apiUrl.find_last_of('@')) {
            slugs.emplace("team", "");
            slugs.emplace("suite", "");
            slugs.emplace("version", "");
            return;
        }
        std::istringstream iss(apiUrl.substr(apiUrl.find_last_of('@') + 1));
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
    ApiUrl::ApiUrl(
        const std::string& apiRoot,
        const std::string& team,
        const std::string& suite,
        const std::string& version)
        : root(apiRoot)
    {
        slugs.emplace("team", team);
        slugs.emplace("suite", suite);
        slugs.emplace("version", version);
    }

    /**
     *
     */
    ApiConnector::ApiConnector(
        const ApiUrl& apiUrl,
        const std::string& apiToken)
        : _apiUrl(apiUrl)
        , _apiToken(apiToken)
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
    bool ApiConnector::handshake() const
    {
        HttpClient httpClient(_apiUrl.root);
        rapidjson::Document doc;

        // performing handshake with Weasel Platform
        const auto response = httpClient.getJson("/platform");

        if (response.code == -1) {
            // Weasel Platform appears to be down
            return false;
        }

        if (response.code != 200) {
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
    std::string ApiConnector::authenticate(const std::string& apiKey) const
    {
        HttpClient httpClient(_apiUrl.root);
        rapidjson::Document doc;

        const auto content = weasel::format("{{\"key\": \"{}\"}}", apiKey);
        const auto response = httpClient.postJson("/client/signin", content);

        // check status of response from Weasel Platform

        if (response.code != 200) {
            throw std::runtime_error(weasel::format("platform authentication failed: {}", response.code));
        }

        // Parse response from Weasel Platform

        if (doc.Parse<0>(response.body.c_str()).HasParseError()) {
            throw std::runtime_error("failed to parse platform response");
        }

        // extract API Token issued by Weasel Platform

        if (!doc.HasMember("token") || !doc["token"].IsString()) {
            throw std::runtime_error("platform response malformed");
        }

        return doc["token"].GetString();
    }

    /**
     *
     */
    std::vector<std::string> ApiConnector::getElements() const
    {
        HttpClient httpClient(_apiUrl.root);
        rapidjson::Document doc;

        const auto& path = weasel::format("/element/{}/{}", _apiUrl.slugs.at("team"), _apiUrl.slugs.at("suite"));
        const auto response = httpClient.getJson(path, _apiToken);

        // check status of response from Weasel Platform

        if (response.code != 200) {
            throw std::runtime_error("received unexpected platform response");
        }

        // parse response from Weasel Platform

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
    std::vector<std::string> ApiConnector::submitResults(
        const std::string& content,
        const unsigned int maxRetries) const
    {
        std::vector<std::string> errors;
        for (auto i = 0ul; i < maxRetries; ++i) {
            HttpClient httpClient(_apiUrl.root);
            const auto response = httpClient.postBinary("/client/submit", content, _apiToken);
            if (response.code == 204) {
                return {};
            }
            errors.emplace_back(weasel::format(
                "failed to post testresults for a group of testcases ({}/{})",
                i + 1,
                maxRetries));
        }
        errors.emplace_back("giving up on submitting testresults");
        return errors;
    }

    /**
     *
     */
    std::string ApiConnector::getJson(const std::string& route) const
    {
        HttpClient httpClient(_apiUrl.root);
        const auto response = httpClient.getJson(route);
        return response.body;
    }

    /**
     *
     */
    bool ApiConnector::patchJson(const std::string& route, const std::string& body) const
    {
        HttpClient httpClient(_apiUrl.root);
        const auto response = httpClient.patchJson(route, body);
        return response.code == 204;
    }

    /**
     *
     */
    bool ApiConnector::postJson(const std::string& route, const std::string& content) const
    {
        HttpClient httpClient(_apiUrl.root);
        const auto response = httpClient.postJson(route, content, _apiToken);
        return response.code == 204;
    }

} // namespace weasel
