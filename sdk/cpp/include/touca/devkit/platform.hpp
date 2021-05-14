/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "touca/lib_api.hpp"
#include <memory>
#include <string>
#include <vector>

namespace touca {

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
    class TOUCA_CLIENT_API Transport {
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
    class TOUCA_CLIENT_API ApiUrl {
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
    class TOUCA_CLIENT_API Platform {
    public:
        /**
         *
         */
        explicit Platform(const ApiUrl& api_url);

        /**
         *
         */
        bool set_params(
            const std::string& team,
            const std::string& suite,
            const std::string& revision);

        /**
         * Checks server status.
         *
         * @return true if server is ready to serve incoming requests.
         */
        bool handshake() const;

        /**
         * Authenticates with the server using the provided API Key.
         *
         * @param api_key API Key to be used for authentication.
         *                Can be retrieved from server and is unique for
         *                each user account.
         * @return true if authentication was successful.
         */
        bool auth(const std::string& api_key);

        /**
         * Submits test results in binary format for one or multiple testcases
         * to the server. Expects a valid API Token.
         *
         * @param content test results in binary format.
         * @param max_retries maximum number of retries.
         * @return a list of error messages useful for logging or printing
         */
        std::vector<std::string> submit(
            const std::string& content,
            const unsigned max_retries) const;

        /**
         * Informs the server that no more testcases will be submitted for
         * the specified revision.
         *
         * @return true if we managed to seal the specified revision.
         */
        bool seal() const;

        /**
         * Queries the server for the list of testcases that are submitted
         * to the baseline version of this suite. Expects a valid API Token.
         *
         * @return list of test cases of the baseline version of this suite.
         */
        std::vector<std::string> elements() const;

        /**
         * Checks if we are already authenticated with the server.
         *
         * @return true if object has a valid authentication token.
         */
        inline bool has_token() const { return _is_auth; }

        /**
         * Provides a description of any error encountered during the
         * execution of the most recently called member function.
         * Intended to be used for logging purposes.
         *
         * @return any error encountered during the last function call.
         */
        inline std::string get_error() const { return _error; }

        /**
         *
         */
        bool cmp_submit(const std::string& url, const std::string& content) const;

        /**
         *
         */
        bool cmp_jobs(std::string& content) const;

        /**
         *
         */
        bool cmp_stats(const std::string& content) const;

    private:
        ApiUrl _api;
        std::unique_ptr<Transport> _http;
        bool _is_auth = false;
        mutable std::string _error;
    };

} // namespace touca
