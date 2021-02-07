/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/devkit/platform.hpp"
#include "weasel/devkit/httpclient.hpp"
#include "weasel/devkit/utils.hpp"
#include "rapidjson/document.h"
#include <sstream>

namespace weasel {

    /**
     *
     */
    ApiUrl::ApiUrl(const std::string& api_url)
    {
        if (api_url.empty()) {
            return;
        }
        const auto index = api_url.find_last_of('@');
        _root = api_url.substr(0, index);
        if (_root.back() == '/') {
            _root.pop_back();
        }
        if (index == std::string::npos) {
            return;
        }
        std::istringstream iss(api_url.substr(index + 1));
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
        _team = items.at(0);
        _suite = items.at(1);
        _revision = items.at(2);
    }

    /**
     *
     */
    bool ApiUrl::confirm(
        const std::string& team,
        const std::string& suite,
        const std::string& revision)
    {
        if (!team.empty() && _team.empty()) {
            _team = team;
        }
        if (!suite.empty() && _suite.empty()) {
            _suite = suite;
        }
        if (!revision.empty() && _revision.empty()) {
            _revision = revision;
        }
        const auto& set_error = [this](const std::string& k) {
            _error = fmt::format("parameter \"{}\" is in conflict with API URL", k);
            return false;
        };
        if (!revision.empty() && _revision != revision) {
            return set_error("revision");
        }
        if (!suite.empty() && _suite != suite) {
            return set_error("suite");
        }
        if (!team.empty() && _team != team) {
            return set_error("team");
        }
        return true;
    }

    /**
     *
     */
    Platform::Platform(const ApiUrl& api)
        : _api(api), _http(new Http(api._root))
    {
    }

    /**
     *
     */
    bool Platform::set_params(const std::string& team,
        const std::string& suite, const std::string& revision)
    {
        if (!_api.confirm(team, suite, revision)) {
            _error = _api._error;
            return false;
        }
        return true;
    }

    /**
     * Perform handshake with Weasel Platform to ensure that it is ready
     * to serve further requests and queries. Parse response from Weasel
     * Platform as a precaution.
     */
    bool Platform::handshake() const
    {
        const auto response = _http->get("/platform");
        if (response.status == -1) {
            _error = "the platform appears to be down";
            return false;
        }
        if (response.status != 200) {
            _error = "response from the platform is unexpected";
            return false;
        }
        rapidjson::Document doc;
        if (doc.Parse<0>(response.body.c_str()).HasParseError()) {
            _error = "failed to parse response from the platform";
            return false;
        }
        if (!doc.HasMember("ready") || !doc["ready"].IsBool()) {
            _error = "response form the platform is ill-formed";
            return false;
        }
        if (!doc["ready"].GetBool()) {
            _error = "platform is not ready";
            return false;
        }
        return true;
    }

    /**
     * Submit authentication request. If Platform accepts this request, parse
     * the response to extract the API Token issued by Weasel Platform.
     */
    bool Platform::auth(const std::string& apiKey)
    {
        const auto content = weasel::format("{{\"key\": \"{}\"}}", apiKey);
        const auto response = _http->post("/client/signin", content);
        if (response.status == -1) {
            _error = "the platform appears to be down";
            return false;
        }
        if (response.status != 200) {
            _error = weasel::format("platform authentication failed: {}", response.status);
            return false;
        }
        rapidjson::Document doc;
        if (doc.Parse<0>(response.body.c_str()).HasParseError()) {
            _error = "failed to parse platform response";
            return false;
        }
        if (!doc.HasMember("token") || !doc["token"].IsString()) {
            _error = "platform response malformed";
            return false;
        }
        _http->set_token(doc["token"].GetString());
        _is_auth = true;
        return true;
    }

    /**
     *
     */
    std::vector<std::string> Platform::elements() const
    {
        const auto& route = weasel::format("/element/{}/{}", _api._team, _api._suite);
        const auto response = _http->get(route);
        if (response.status != 200) {
            _error = "received unexpected platform response";
            return {};
        }
        rapidjson::Document doc;
        if (doc.Parse<0>(response.body.c_str()).HasParseError()) {
            _error = "failed to parse response from the platform";
            return {};
        }
        std::vector<std::string> elements;
        for (const auto& rjElement : doc.GetArray()) {
            elements.emplace_back(rjElement["name"].GetString());
        }
        return elements;
    }

    /**
     *
     */
    std::vector<std::string> Platform::submit(
        const std::string& content,
        const unsigned max_retries) const
    {
        std::vector<std::string> errors;
        for (auto i = 0ul; i < max_retries; ++i) {
            const auto response = _http->binary("/client/submit", content);
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
    bool Platform::seal() const
    {
        const auto route = fmt::format("/batch/{}/{}/{}/seal2",
            _api._team, _api._suite, _api._revision);
        const auto response = _http->post(route);
        return response.status == 204;
    }

} // namespace weasel
