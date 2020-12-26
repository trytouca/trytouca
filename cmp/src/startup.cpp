/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "startup.hpp"
#include "weasel/devkit/logger.hpp"
#include "weasel/devkit/platform.hpp"
#include <chrono>
#include <thread>

/**
 *
 */
void initialize_loggers(const Options& options)
{
    weasel::setup_console_logger(options.log_level);
    if (options.log_dir.has_value())
    {
        weasel::setup_file_logger(options.log_dir.value().string());
    }
}

/**
 *
 */
bool run_startup_stage(const Options& options)
{
    const auto max_attempts = options.startup_timeout / options.startup_interval;
    const auto& interval = std::chrono::milliseconds(options.startup_interval);
    WEASEL_LOG_INFO("running start-up stage");
    weasel::ApiUrl apiUrl(options.api_url);
    weasel::ApiConnector apiConnector(apiUrl);
    for (auto i = 1u; i <= max_attempts; ++i)
    {
        if (apiConnector.handshake())
        {
            WEASEL_LOG_INFO("start-up phase completed");
            return true;
        }
        WEASEL_LOG_WARN("running start-up stage: attempt ({}/{})", i, max_attempts);
        std::this_thread::sleep_for(interval);
    }
    return false;
}
