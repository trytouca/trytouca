/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "curl/curl.h"
#include <string>

namespace weasel {

    struct GlobalHttp {
        GlobalHttp();
        ~GlobalHttp();
    };

    class HttpClient {
    public:
        struct Response {
            long code = -1;
            std::string body;
        };

        HttpClient(const std::string& root);

        ~HttpClient();

        Response getJson(
            const std::string& route);

        Response getJson(
            const std::string& route,
            const std::string& apiToken);

        Response postJson(
            const std::string& route,
            const std::string& content,
            const std::string& apiToken = "");

        Response patchJson(
            const std::string& route,
            const std::string& content);

        Response postBinary(
            const std::string& route,
            const std::string& content,
            const std::string& apiToken);

    private:
        std::string _root;
        CURL* _curl = nullptr;
        CURLcode _curlCode = CURLE_FAILED_INIT;
        struct curl_slist* _headers = nullptr;
        enum class Method {
            Get,
            Patch,
            Post
        };

        HttpClient::Response jsonImpl(
            const Method method,
            const std::string& route,
            const std::string& content);
    };

} // namespace weasel
