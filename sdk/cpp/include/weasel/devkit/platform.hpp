/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "weasel/lib_api.hpp"
#include <string>
#include <unordered_map>
#include <vector>

namespace weasel {

    struct WEASEL_CLIENT_API ApiUrl {
        ApiUrl(const std::string& api_url);
        std::string root;
        std::unordered_map<std::string, std::string> slugs;
    };

    struct ResponseV2 {
        const int status = -1;
        const std::string body;
    };

    class HttpV2 {
    public:
        explicit HttpV2(const std::string& root);
        void set_token(const std::string& token);
        ResponseV2 get(const std::string& route) const;
        ResponseV2 patch(const std::string& route, const std::string& body = "") const;
        ResponseV2 post(const std::string& route, const std::string& body = "") const;
        ResponseV2 binary(const std::string& route, const std::string& content) const;

    private:
        std::string _root;
        std::string _token;
    };

    class WEASEL_CLIENT_API PlatformV2 {
    public:
        explicit PlatformV2(
            const std::string& root, const std::string& team,
            const std::string& suite, const std::string& revision);
        bool handshake() const;
        bool auth(const std::string& apiKey);
        bool seal() const;
        std::vector<std::string> submit(const std::string& content, const unsigned max_retries) const;
        std::vector<std::string> elements() const;
        std::string get_error() const;
        inline bool has_token() const { return _is_auth; }

    private:
        HttpV2 _http;
        bool _is_auth = false;
        const std::string& _team;
        const std::string& _suite;
        const std::string& _revision;
        mutable std::string _error;
    };

} // namespace weasel
