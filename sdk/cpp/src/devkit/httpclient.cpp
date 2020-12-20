/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/devkit/httpclient.hpp"
#include "fmt/core.h"
#include <stdexcept>

size_t
callbackFunction(char* contents, size_t size, size_t nmemb, std::string* userp)
{
    userp->append(contents, size * nmemb);
    return size * nmemb;
}

namespace weasel {

    /**
     *
     */
    GlobalHttp::GlobalHttp()
    {
        curl_global_init(CURL_GLOBAL_ALL);
    }

    /**
     *
     */
    GlobalHttp::~GlobalHttp()
    {
        curl_global_cleanup();
    }

    /**
     *
     */
    HttpClient::HttpClient(const std::string& root)
        : _root(root)
        , _curl(curl_easy_init())
    {
    }

    /**
     *
     */
    HttpClient::~HttpClient()
    {
        curl_slist_free_all(_headers);
        curl_easy_cleanup(_curl);
    }

    /**
     *
     */
    HttpClient::Response HttpClient::jsonImpl(
        const Method method,
        const std::string& route,
        const std::string& body)
    {
        HttpClient::Response response;
        _headers = curl_slist_append(_headers, "Accept: application/json");
        _headers = curl_slist_append(_headers, "Content-Type: application/json");
        _headers = curl_slist_append(_headers, "charsets: utf-8");

        curl_easy_setopt(_curl, CURLOPT_HTTPHEADER, _headers);
        curl_easy_setopt(_curl, CURLOPT_URL, (_root + route).c_str());
        curl_easy_setopt(_curl, CURLOPT_USERAGENT, "weasel-client-cpp/1.2.1");
        curl_easy_setopt(_curl, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
        curl_easy_setopt(_curl, CURLOPT_SSL_VERIFYPEER, 0L); // only for https
        curl_easy_setopt(_curl, CURLOPT_SSL_VERIFYHOST, 0L); // only for https
        curl_easy_setopt(_curl, CURLOPT_TIMEOUT, 10);
        curl_easy_setopt(_curl, CURLOPT_FOLLOWLOCATION, 1L);
        curl_easy_setopt(_curl, CURLOPT_WRITEFUNCTION, callbackFunction);
        curl_easy_setopt(_curl, CURLOPT_WRITEDATA, &response.body);

        switch (method)
        {
        case Method::Get:
            curl_easy_setopt(_curl, CURLOPT_HTTPGET, 1);
            break;
        case Method::Post:
            curl_easy_setopt(_curl, CURLOPT_POSTFIELDS, body.c_str());
            curl_easy_setopt(_curl, CURLOPT_POSTFIELDSIZE, -1L);
            break;
        case Method::Patch:
            curl_easy_setopt(_curl, CURLOPT_POSTFIELDS, body.c_str());
            curl_easy_setopt(_curl, CURLOPT_POSTFIELDSIZE, -1L);
            curl_easy_setopt(_curl, CURLOPT_CUSTOMREQUEST, "PATCH");
            break;
        default:
            throw std::invalid_argument("not implemented");
        }

        _curlCode = curl_easy_perform(_curl);
        if (_curlCode == CURLE_OK)
        {
            curl_easy_getinfo(_curl, CURLINFO_RESPONSE_CODE, &response.code);
        }

        return response;
    }

    /**
     *
     */
    HttpClient::Response HttpClient::getJson(const std::string& route)
    {
        return jsonImpl(Method::Get, route, "");
    }

    /**
     *
     */
    HttpClient::Response HttpClient::getJson(
        const std::string& route,
        const std::string& apiToken)
    {
        _headers = curl_slist_append(_headers, fmt::format("Authorization: Bearer {}", apiToken).c_str());
        return getJson(route);
    }

    /**
     *
     */
    HttpClient::Response HttpClient::postJson(
        const std::string& route,
        const std::string& body)
    {
        return jsonImpl(Method::Post, route, body);
    }

    /**
     *
     */
    HttpClient::Response HttpClient::patchJson(
        const std::string& route,
        const std::string& body)
    {
        return jsonImpl(Method::Patch, route, body);
    }

    HttpClient::Response HttpClient::postBinary(
        const std::string& route,
        const std::string& content,
        const std::string& apiToken)
    {
        HttpClient::Response response;
        _headers = curl_slist_append(_headers, "Content-Type: application/octet-stream");
        _headers = curl_slist_append(_headers, fmt::format("Authorization: Bearer {}", apiToken).c_str());

        curl_easy_setopt(_curl, CURLOPT_HTTPHEADER, _headers);
        curl_easy_setopt(_curl, CURLOPT_POSTFIELDS, content.data());
        curl_easy_setopt(_curl, CURLOPT_POSTFIELDSIZE, content.size());
        curl_easy_setopt(_curl, CURLOPT_URL, (_root + route).c_str());
        curl_easy_setopt(_curl, CURLOPT_USERAGENT, "weasel-client-cpp/1.2.1");
        curl_easy_setopt(_curl, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
        curl_easy_setopt(_curl, CURLOPT_SSL_VERIFYPEER, 0L); // only for https
        curl_easy_setopt(_curl, CURLOPT_SSL_VERIFYHOST, 0L); // only for https
        curl_easy_setopt(_curl, CURLOPT_TIMEOUT, 10);
        curl_easy_setopt(_curl, CURLOPT_WRITEFUNCTION, callbackFunction);
        curl_easy_setopt(_curl, CURLOPT_WRITEDATA, &response.body);

        _curlCode = curl_easy_perform(_curl);
        if (_curlCode == CURLE_OK)
        {
            curl_easy_getinfo(_curl, CURLINFO_RESPONSE_CODE, &response.code);
        }

        return response;
    }

} // namespace weasel
