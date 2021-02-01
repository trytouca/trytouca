/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "weasel/lib_api.hpp"
#include <string>
#include <unordered_map>
#include <vector>

namespace weasel {

    /**
     *
     */
    struct WEASEL_CLIENT_API ApiUrl {
        /**
         *
         */
        ApiUrl(const std::string& apiUrl);

        /**
         *
         */
        ApiUrl(
            const std::string& apiRoot,
            const std::string& team,
            const std::string& suite,
            const std::string& version);

        std::string root;
        std::unordered_map<std::string, std::string> slugs;
    };

    /**
     *
     */
    class WEASEL_CLIENT_API ApiConnector {
    public:
        /**
         *
         */
        ApiConnector(const ApiUrl& apiUrl, const std::string& apiToken = "");

        /**
         * Checks platform status.
         *
         * @return true if platform is ready to serve incoming requests.
         */
        bool handshake() const;

        /**
         * Authenticates with the platform using the provided API Key.
         *
         * @param apiKey API Key to be used for authentication.
         *         Can be retrieved from the weasel Platform and is unique for
         *         each user account.
         * @return API Token issued by the backend. This token can be used to
         *         construct a new ApiConnector with which functions like
         *         `submitResults` and `getElements` may be called.
         * @throw std::runtime_error if connection with the platform is not
         *        established or if the platform determins that the API Key
         *        is invalid.
         */
        std::string authenticate(const std::string& apiKey) const;

        /**
         * Submits test results in binary format for one or multiple testcases
         * to the platform.
         *
         * @param content test results in binary format that conform to Weasel
         *                flatbuffers schema.
         * @param maxRetries maximum number of retries to make if submission
         *                   fails.
         * @return a list of error messages useful for logging or printing
         * @note expects a valid API Token
         */
        std::vector<std::string> submitResults(
            const std::string& content,
            const unsigned int maxRetries) const;

        /**
         * Queries the platform for the list of testcases that are submitted
         * to the baseline version of this suite.
         *
         * @return list of slugs of elements in baseline version of this suite.
         * @throw std::runtime_error on failure
         * @note expects a valid API Token
         */
        std::vector<std::string> getElements() const;

        /**
         *
         */
        std::string getJson(const std::string& route) const;

        /**
         *
         */
        bool patchJson(const std::string& route, const std::string& body) const;

        /**
         *
         */
        bool postJson(const std::string& route, const std::string& content = "") const;

    private:
        const ApiUrl _apiUrl;
        const std::string _apiToken;
    };

} // namespace weasel
