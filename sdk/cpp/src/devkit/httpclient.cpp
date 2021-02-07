/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/devkit/httpclient.hpp"
#include "weasel/devkit/utils.hpp"

namespace weasel {

    /**
     *
     */
    Http::Http(const std::string& root)
    {
        _cli = Cli(new httplib::Client(root.c_str()));
        _cli->set_default_headers({ { "Accept-Charset", "utf-8" },
            { "Accept", "application/json" },
            { "User-Agent", "weasel-client-cpp/1.2.1" } });
#ifdef CPPHTTPLIB_OPENSSL_SUPPORT
        _cli->enable_server_certificate_verification(false);
#endif
    }

    /**
     *
     */
    void Http::set_token(const std::string& token)
    {
        _cli->set_bearer_token_auth(token.c_str());
    }

    /**
     *
     */
    Response Http::get(const std::string& route) const
    {
        const auto result = _cli->Get(route.c_str());
        if (!result) {
            return { -1, weasel::format("failed to submit HTTP GET request to {}", route) };
        }
        return { result->status, result->body };
    }

    /**
     *
     */
    Response Http::patch(const std::string& route, const std::string& body) const
    {
        const auto result = _cli->Patch(route.c_str(), body, "application/json");
        if (!result) {
            return { -1, weasel::format("failed to submit HTTP PATCH request to {}", route) };
        }
        return { result->status, result->body };
    }

    /**
     *
     */
    Response Http::post(const std::string& route, const std::string& body) const
    {
        const auto result = _cli->Post(route.c_str(), body, "application/json");
        if (!result) {
            return { -1, weasel::format("failed to submit HTTP POST request to {}", route) };
        }
        return { result->status, result->body };
    }

    /**
     *
     */
    Response Http::binary(const std::string& route, const std::string& content) const
    {
        const auto result = _cli->Post(route.c_str(), content, "application/octet-stream");
        if (!result) {
            return { -1, weasel::format("failed to submit HTTP POST request to {}", route) };
        }
        return { result->status, result->body };
    }

} // namespace weasel
