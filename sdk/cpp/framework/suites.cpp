/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/framework/suites.hpp"
#include "weasel/devkit/platform.hpp"
#include <algorithm>
#include <fstream>

namespace weasel { namespace framework {

    /**
     *
     */
    RemoteSuite::RemoteSuite(const Options& options)
        : Suite()
        , _options(options)
    {
    }

    /**
     *
     */
    void RemoteSuite::initialize()
    {
        // To obtain list of testcases from Weasel Platform, we expect
        // the following configuration options are set.

        const std::vector<std::string> keys = { "api-key", "api-url", "team", "suite", "revision" };
        const auto predicate = [this](const std::string& k) { return _options.count(k); };
        if (!std::all_of(keys.begin(), keys.end(), predicate)) {
            return;
        }

        // authenticate to Weasel Platform and obtain an API Token.
        // If authentication fails, an exception is thrown in which.
        // We choose not to handle this exception here and propagate it
        // to the Weasel Test Framework instead so it can be logged per
        // user implementation.

        const auto apiRoot = ApiUrl(_options.at("api-url")).root;
        ApiUrl apiUrl(apiRoot, _options.at("team"), _options.at("suite"), _options.at("revision"));
        const auto& apiToken = ApiConnector(apiUrl).authenticate(_options.at("api-key"));
        if (apiToken.empty()) {
            return;
        }

        // ask Weasel Platform for the list of elements

        ApiConnector apiConnector(apiUrl, apiToken);
        const auto& elements = apiConnector.getElements();
        for (const auto& element : elements) {
            push(element);
        }
    }

    /**
     *
     */
    FileSuite::FileSuite(const std::string& path)
        : Suite()
        , _path(path)
    {
    }

    /**
     *
     */
    void FileSuite::initialize()
    {
        std::string line;
        std::ifstream ifs(_path);
        while (std::getline(ifs, line)) {
            // skip empty lines
            if (line.empty()) {
                continue;
            }
            // skip comment lines: by default, we define comment lines as
            // lines that start with two pound characters
            if (line.compare(0, 2, "##") == 0) {
                continue;
            }
            push(line);
        }
    }

}} // namespace weasel::framework
