/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include <filesystem>
#include <optional>
#include <string>

/**
 *
 */
struct Options
{
    std::optional<bool> help;
    std::string api_url;
    std::string log_level;
    std::optional<std::filesystem::path> log_dir;
    std::filesystem::path project_dir;
    std::filesystem::path storage_dir;
    unsigned max_failures;
    unsigned polling_interval;
    unsigned startup_interval;
    unsigned startup_timeout;
};

/**
 *
 */
bool parse_arguments(int argc, char* argv[], Options& options);
