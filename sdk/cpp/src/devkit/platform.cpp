// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/devkit/platform.hpp"
#include "httplib.h"
#include "rapidjson/document.h"
#include "touca/devkit/utils.hpp"
#include <regex>
#include <sstream>

namespace touca {

    /**
     *
     */
    class Http : public Transport {
    public:
        explicit Http(const std::string& root);
        void set_token(const std::string& token);
        Response get(const std::string& route) const;
        Response patch(const std::string& route, const std::string& body = "") const;
        Response post(const std::string& route, const std::string& body = "") const;
        Response binary(const std::string& route, const std::string& content) const;

    private:
        mutable httplib::Client _cli;
    };

    /**
     *
     */
    Http::Http(const std::string& root)
        : _cli(root.c_str())
    {
        _cli.set_default_headers({ { "Accept-Charset", "utf-8" },
            { "Accept", "application/json" },
            { "User-Agent", "touca-client-cpp/1.4.1" } });
#ifdef CPPHTTPLIB_OPENSSL_SUPPORT
        _cli.enable_server_certificate_verification(false);
#endif
    }

    /**
     *
     */
    void Http::set_token(const std::string& token)
    {
        _cli.set_bearer_token_auth(token.c_str());
    }

    /**
     *
     */
    Response Http::get(const std::string& route) const
    {
        const auto& result = _cli.Get(route.c_str());
        if (!result) {
            return { -1, touca::format("failed to submit HTTP GET request to {}", route) };
        }
        return { result->status, result->body };
    }

    /**
     *
     */
    Response Http::patch(const std::string& route, const std::string& body) const
    {
        const auto& result = _cli.Patch(route.c_str(), body, "application/json");
        if (!result) {
            return { -1, touca::format("failed to submit HTTP PATCH request to {}", route) };
        }
        return { result->status, result->body };
    }

    /**
     *
     */
    Response Http::post(const std::string& route, const std::string& body) const
    {
        const auto& result = _cli.Post(route.c_str(), body, "application/json");
        if (!result) {
            return { -1, touca::format("failed to submit HTTP POST request to {}", route) };
        }
        return { result->status, result->body };
    }

    /**
     *
     */
    Response Http::binary(const std::string& route, const std::string& content) const
    {
        const auto& result = _cli.Post(route.c_str(), content, "application/octet-stream");
        if (!result) {
            return { -1, touca::format("failed to submit HTTP POST request to {}", route) };
        }
        return { result->status, result->body };
    }

    /**
     *
     */
    ApiUrl::ApiUrl(const std::string& url)
    {
        const static std::regex pattern(
            R"(^(?:([a-z]+)://)?([^:/?#]+)(?::(\d+))?/?(.*)?$)");
        std::cmatch result;
        if (!std::regex_match(url.c_str(), result, pattern)) {
            _error = touca::format("invalid url: \"{}\"", url);
            return;
        }
        _root.scheme = result[1];
        _root.host = result[2];
        _root.port = result[3];
        const std::string path = result[4];
        if (path.empty()) {
            return;
        }
        const auto index = path.find_last_of('@');
        _prefix = path.substr(0, index);
        if (_prefix.back() == '/') {
            _prefix.pop_back();
        }
        if (index == std::string::npos) {
            return;
        }
        std::istringstream iss(path.substr(index + 1));
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
    std::string ApiUrl::root() const
    {
        auto output = _root.host;
        if (!_root.scheme.empty()) {
            output.insert(0, touca::format("{}://", _root.scheme));
        }
        if (!_root.port.empty()) {
            return touca::format("{}:{}", output, _root.port);
        }
        return output;
    }

    /**
     *
     */
    std::string ApiUrl::route(const std::string& path) const
    {
        if (path.empty()) {
            return _prefix;
        }
        if (_prefix.empty()) {
            return path;
        }
        return "/" + _prefix + path;
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
        : _api(api)
        , _http(new Http(api.root()))
    {
        if (!_api._error.empty()) {
            _error = _api._error;
        }
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
     * Perform handshake with the server to ensure that it is ready to
     * serve further requests and queries. Parse response from the server
     * as a precaution.
     */
    bool Platform::handshake() const
    {
        _error.clear();
        const auto response = _http->get(_api.route("/platform"));
        if (response.status == -1) {
            _error = response.body;
            return false;
        }
        if (response.status != 200) {
            _error = "unexpected server response";
            return false;
        }
        rapidjson::Document doc;
        if (doc.Parse<0>(response.body.c_str()).HasParseError()) {
            _error = "failed to parse response from the server";
            return false;
        }
        if (!doc.HasMember("ready") || !doc["ready"].IsBool()) {
            _error = "response form the server is ill-formed";
            return false;
        }
        if (!doc["ready"].GetBool()) {
            _error = "server is not ready";
            return false;
        }
        return true;
    }

    /**
     * Submit authentication request. If the server accepts this request,
     * parse the response to extract the API Token issued by the server.
     */
    bool Platform::auth(const std::string& apiKey)
    {
        _error.clear();
        const auto content = touca::format("{{\"key\": \"{}\"}}", apiKey);
        const auto response = _http->post(_api.route("/client/signin"), content);
        if (response.status == -1) {
            _error = response.body;
            return false;
        }
        if (response.status != 200) {
            _error = touca::format("authentication failed: {}", response.status);
            return false;
        }
        rapidjson::Document doc;
        if (doc.Parse<0>(response.body.c_str()).HasParseError()) {
            _error = "failed to parse server response";
            return false;
        }
        if (!doc.HasMember("token") || !doc["token"].IsString()) {
            _error = "unexpected server response";
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
        _error.clear();
        const auto& route = touca::format("/element/{}/{}", _api._team, _api._suite);
        const auto& response = _http->get(_api.route(route));
        if (response.status == -1) {
            _error = response.body;
            return {};
        }
        if (response.status != 200) {
            _error = "unexpected server response";
            return {};
        }
        rapidjson::Document doc;
        if (doc.Parse<0>(response.body.c_str()).HasParseError()) {
            _error = "failed to parse server response";
            return {};
        }
        std::vector<std::string> elements;
        for (const auto& rjElement : doc.GetArray()) {
            elements.emplace_back(rjElement["name"].GetString());
        }
        if (elements.empty()) {
            _error = "suite has no test case";
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
            const auto response = _http->binary(_api.route("/client/submit"), content);
            if (response.status == 204) {
                return {};
            }
            errors.emplace_back(touca::format(
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
        _error.clear();
        const auto route = fmt::format("{}/batch/{}/{}/{}/seal2",
            _api._team, _api._suite, _api._revision);
        const auto& response = _http->post(_api.route(route));
        if (response.status == -1) {
            _error = response.body;
            return false;
        }
        if (response.status != 204) {
            _error = touca::format("failed to seal specified version: {}", response.status);
            return false;
        }
        return true;
    }

    /**
     *
     */
    bool Platform::cmp_submit(
        const std::string& url,
        const std::string& content) const
    {
        _error.clear();
        const auto& response = _http->patch(_api.route(url), content);
        if (response.status == -1) {
            _error = response.body;
            return false;
        }
        if (response.status != 204) {
            _error = touca::format("failed to submit result: {}", response.status);
            return false;
        }
        return true;
    }

    /**
     *
     */
    bool Platform::cmp_jobs(std::string& content) const
    {
        _error.clear();
        const auto& response = _http->get(_api.route("/cmp"));
        if (response.status == -1) {
            _error = response.body;
            return false;
        }
        if (response.status != 200) {
            _error = touca::format("unexpected server response: {}", response.status);
            return false;
        }
        content = response.body;
        return true;
    }

    /**
     *
     */
    bool Platform::cmp_stats(const std::string& content) const
    {
        _error.clear();
        const auto& response = _http->post(_api.route("/cmp/stats"), content);
        if (response.status == -1) {
            _error = response.body;
            return false;
        }
        if (response.status != 204) {
            _error = touca::format("unexpected server response: {}", response.status);
            return false;
        }
        return true;
    }

} // namespace touca
