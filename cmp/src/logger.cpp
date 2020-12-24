/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "comparator/logger.hpp"
#include "spdlog/async.h"
#include "spdlog/sinks/basic_file_sink.h"
#include "spdlog/sinks/rotating_file_sink.h"
#include "spdlog/sinks/stdout_color_sinks.h"
#include "spdlog/spdlog.h"
#include <filesystem>

/**
 *
 */
void update_logger(spdlog::sink_ptr sink)
{
    auto main_logger = spdlog::get("weasel-cmp");
    if (main_logger)
    {
        main_logger->sinks().push_back(sink);
        return;
    }
    std::vector<spdlog::sink_ptr> sinks { sink };
    auto logger = std::make_shared<spdlog::async_logger>("weasel-cmp", sinks.begin(), sinks.end(), spdlog::thread_pool(), spdlog::async_overflow_policy::block);
    spdlog::register_logger(logger);
    spdlog::set_default_logger(logger);
}

/**
 *
 */
void setup_console_logger(const std::string& log_level)
{
    spdlog::init_thread_pool(8192, 1);
    auto console_sink = std::make_shared<spdlog::sinks::stdout_color_sink_mt>();
    console_sink->set_pattern("[%Y-%m-%dT%H:%M:%SZ] [%t] %^[%l]%$ %v");
    console_sink->set_level(spdlog::level::from_str(log_level));
    update_logger(console_sink);
}

/**
 *
 */
void setup_file_logger(const std::string& log_dir)
{
    const auto& log_file = std::filesystem::path(log_dir) / "weasel_cmp.log";
    auto file_sink = std::make_shared<spdlog::sinks::rotating_file_sink_mt>(log_file, 1024 * 1024 * 10, 100);
    file_sink->set_pattern("[%Y-%m-%dT%H:%M:%SZ] [%t] [%l] %v");
    file_sink->set_level(spdlog::level::debug);
    update_logger(file_sink);
}
