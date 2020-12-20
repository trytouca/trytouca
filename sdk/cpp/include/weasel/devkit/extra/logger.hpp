/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "weasel/devkit/utils.hpp"
#include <iostream>
#include <memory>
#include <mutex>
#include <unordered_map>
#include <utility>
#include <vector>

#ifdef _WIN32
#define __func__ __FUNCTION__
#endif

#define WEASEL_LOG_DEBUG(...)                   \
    weasel::internal::Logger::instance().log(   \
        weasel::internal::Logger::Level::Debug, \
        __FILE__,                               \
        __LINE__,                               \
        __func__,                               \
        __VA_ARGS__)
#define WEASEL_LOG_INFO(...)                   \
    weasel::internal::Logger::instance().log(  \
        weasel::internal::Logger::Level::Info, \
        __FILE__,                              \
        __LINE__,                              \
        __func__,                              \
        __VA_ARGS__)
#define WEASEL_LOG_WARN(...)                   \
    weasel::internal::Logger::instance().log(  \
        weasel::internal::Logger::Level::Warn, \
        __FILE__,                              \
        __LINE__,                              \
        __func__,                              \
        __VA_ARGS__)
#define WEASEL_LOG_ERROR(...)                   \
    weasel::internal::Logger::instance().log(   \
        weasel::internal::Logger::Level::Error, \
        __FILE__,                               \
        __LINE__,                               \
        __func__,                               \
        __VA_ARGS__)

namespace weasel { namespace internal {

    /**
     *
     */
    class WEASEL_CLIENT_API Logger
    {
    public:
        enum Level : unsigned char
        {
            Debug,
            Info,
            Warn,
            Error
        };

        static const std::unordered_map<Level, std::string> level_names;

        static const std::unordered_map<std::string, Level> level_values;

        /**
         *
         */
        static Logger& instance();

        /**
         *
         */
        void add_file_handler(const std::string& directory, const Level level);

        /**
         *
         */
        void set_console_handler(const Level level);

        /**
         *
         */
        template <typename... Args>
        inline void log(
            const Level level,
            const std::string& file,
            const unsigned int line,
            const std::string& func,
            const std::string& str,
            Args&&... args) const
        {
            const auto& msg = weasel::format(str, std::forward<Args>(args)...);
            doLog(level, file, line, func, msg);
        }

        /**
         *
         */
        virtual ~Logger() = default;

        /**
         * ensure we will not get copies of the singleton object
         * by forbidding copy construction
         */
        Logger(const Logger& logger) = delete;

        /**
         * ensure we will not get copies of the singleton object
         * by forbidding assignment construction
         */
        void operator=(const Logger& logger) = delete;

    private:
        /**
         *
         */
        void doLog(
            const Level level,
            const std::string& path,
            const unsigned int line,
            const std::string& func,
            const std::string& msg) const;

        /**
         *
         */
        static std::once_flag _onceFlag;

        /**
         *
         */
        static std::unique_ptr<Logger> _instance;

        /**
         * ensure that the singleton object is not directly instantiated
         */
        Logger() = default;

        bool _initialized = false;
    };

    std::ostream& operator<<(std::ostream& strm, Logger::Level level);

}} // namespace weasel::internal
