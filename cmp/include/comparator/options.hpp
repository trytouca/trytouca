/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "weasel/devkit/filesystem.hpp"
#include <optional>
#include <string>

/**
 *
 */
struct Options
{
    bool parse(int argc, char* argv[]);

    struct
    {
        std::optional<bool> help;
        std::string api_url;
        std::string log_level;
        std::optional<boost::filesystem::path> log_dir;
        boost::filesystem::path project_dir;
        boost::filesystem::path storage_dir;
        unsigned max_failures;
        unsigned polling_interval;
        unsigned startup_interval;
        unsigned startup_timeout;
    } arguments;

private:
    bool parse_impl(int argc, char* argv[]);
};
