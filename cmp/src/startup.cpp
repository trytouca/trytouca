// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "startup.hpp"
#include "object_store.hpp"
#include "touca/devkit/logger.hpp"
#include "touca/devkit/platform.hpp"
#include <chrono>
#include <thread>

/**
 *
 */
void initialize_loggers(const Options& options)
{
    touca::setup_console_logger(options.log_level);
    if (options.log_dir.has_value()) {
        touca::setup_file_logger(options.log_dir.value().string());
    }
}

/**
 *
 */
bool run_startup_stage(const Options& options)
{
    const auto& store = ObjectStore::get_instance(options);
    const auto max_attempts = options.startup_timeout / options.startup_interval;
    const auto& interval = std::chrono::milliseconds(options.startup_interval);
    TOUCA_LOG_INFO("running start-up stage");
    touca::ApiUrl api(options.api_url);
    touca::Platform platform(api);
    for (auto i = 1u; i <= max_attempts; ++i) {
        if (!platform.handshake()) {
            TOUCA_LOG_WARN("failed to connect to backend: {}", platform.get_error());
        } else if (!store.status_check()) {
            TOUCA_LOG_WARN("failed to connect to object storage");
        } else {
            TOUCA_LOG_INFO("start-up phase completed");
            return true;
        }
        TOUCA_LOG_WARN("running start-up stage: attempt ({}/{})", i, max_attempts);
        std::this_thread::sleep_for(interval);
    }
    return false;
}
