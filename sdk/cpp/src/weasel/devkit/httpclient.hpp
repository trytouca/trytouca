/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include <string>

namespace weasel {

    class HttpClient {
    public:
        struct Response {
            Response(const int status, const std::string& body) : status(status), body(body) {};
            int status = -1;
            std::string body;
        };

        HttpClient(const std::string& root);

        Response getJson(
            const std::string& route,
            const std::string& apiToken = "");

        Response postJson(
            const std::string& route,
            const std::string& content,
            const std::string& apiToken = "");

        Response patchJson(
            const std::string& route,
            const std::string& content,
            const std::string& apiToken = "");

        Response postBinary(
            const std::string& route,
            const std::string& content,
            const std::string& apiToken);

    private:
        std::string _root;
    };

} // namespace weasel
