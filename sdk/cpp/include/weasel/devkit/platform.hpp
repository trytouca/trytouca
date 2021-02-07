/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "weasel/lib_api.hpp"
#include <memory>
#include <string>
#include <vector>

namespace weasel {

    /**
     *
     */
    struct Response {
        const int status = -1;
        const std::string body;
    };

    /**
     *
     */
    class WEASEL_CLIENT_API Transport {
    public:
        virtual void set_token(const std::string& token) = 0;
        virtual Response get(const std::string& route) const = 0;
        virtual Response patch(const std::string& route, const std::string& body = "") const = 0;
        virtual Response post(const std::string& route, const std::string& body = "") const = 0;
        virtual Response binary(const std::string& route, const std::string& content) const = 0;
        virtual ~Transport() = default;
    };

    /**
     *
     */
    class WEASEL_CLIENT_API ApiUrl {
    public:
        ApiUrl(const std::string& url);

        bool confirm(
            const std::string& team,
            const std::string& suite,
            const std::string& revision);

        std::string root() const;
        std::string route(const std::string& path) const;

        std::string _team;
        std::string _suite;
        std::string _revision;
        std::string _error;

    private:
        struct {
            std::string scheme;
            std::string host;
            std::string port;
        } _root;
        std::string _prefix;
    };

    /**
     *
     */
    class WEASEL_CLIENT_API Platform {
    public:
        explicit Platform(const ApiUrl& api_url);
        bool set_params(
            const std::string& team,
            const std::string& suite,
            const std::string& revision);
        bool handshake() const;
        bool auth(const std::string& apiKey);
        std::vector<std::string> submit(
            const std::string& content,
            const unsigned max_retries) const;
        bool seal() const;
        std::vector<std::string> elements() const;
        inline bool has_token() const { return _is_auth; }
        inline std::string get_error() const { return _error; }

    private:
        ApiUrl _api;
        std::unique_ptr<Transport> _http;
        bool _is_auth = false;
        mutable std::string _error;
    };

} // namespace weasel
