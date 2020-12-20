/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "weasel/devkit/extra/logger.hpp"
#include "boost/filesystem.hpp"
#include "boost/log/attributes/constant.hpp"
#include "boost/log/core.hpp"
#include "boost/log/expressions.hpp"
#include "boost/log/sinks/text_file_backend.hpp"
#include "boost/log/sources/severity_logger.hpp"
#include "boost/log/support/date_time.hpp"
#include "boost/log/trivial.hpp"
#include "boost/log/utility/setup/common_attributes.hpp"
#include "boost/log/utility/setup/console.hpp"
#include "boost/log/utility/setup/file.hpp"

namespace weasel { namespace internal {

    std::unique_ptr<Logger> Logger::_instance;
    std::once_flag Logger::_onceFlag;

    BOOST_LOG_ATTRIBUTE_KEYWORD(severity, "Severity", Logger::Level)
    BOOST_LOG_ATTRIBUTE_KEYWORD(
        timestamp,
        "TimeStamp",
        boost::posix_time::ptime)

    /**
     *
     */
    const std::unordered_map<Logger::Level, std::string> Logger::level_names = {
        { Logger::Level::Debug, "debug" },
        { Logger::Level::Info, "info" },
        { Logger::Level::Warn, "warning" },
        { Logger::Level::Error, "error" },
    };

    /**
     *
     */
    const std::unordered_map<std::string, Logger::Level>
        Logger::level_values = { { "debug", Logger::Level::Debug },
                                 { "info", Logger::Level::Info },
                                 { "warning", Logger::Level::Warn },
                                 { "error", Logger::Level::Error } };

    /**
     * The implementation for this function can be simplified to the
     * following, but unfortunately Visual C++ does not support Magic
     * Static pattern until VC++2015.
     * (see https://msdn.microsoft.com/en-us/library/hh567368.aspx).
     *
     * @code
     *
     *    Logger& Logger::instance()
     *    {
     *        static Logger instance;
     *        return instance;
     *    }
     *
     * @endcode
     */
    Logger& Logger::instance()
    {
        std::call_once(_onceFlag, [] { _instance.reset(new Logger); });
        return *_instance;
    }

    /**
     *
     */
    void Logger::doLog(
        const Level level,
        const std::string& path,
        const unsigned int line,
        const std::string& func,
        const std::string& msg) const
    {
        namespace bl = boost::log;
        namespace bla = boost::log::attributes;
        namespace fs = boost::filesystem;

        if (!_initialized)
        {
            return;
        }
        bl::sources::severity_logger_mt<Level> lg;
        const auto& filename = fs::path(path).filename().string();
        lg.add_attribute("File", bla::constant<std::string>(filename));
        lg.add_attribute("Line", bla::constant<unsigned int>(line));
        lg.add_attribute("Func", bla::constant<std::string>(func));
        auto rec = lg.open_record(bl::keywords::severity = level);
        if (rec)
        {
            bl::record_ostream stream(rec);
            stream << msg;
            stream.flush();
            lg.push_record(boost::move(rec));
        }
    }

    /**
     *
     */
    void Logger::add_file_handler(const std::string& directory, const Level level)
    {
        namespace bl = boost::log;
        namespace ble = boost::log::expressions;
        namespace blk = boost::log::keywords;
        namespace bls = boost::log::sinks;
        namespace fs = boost::filesystem;

        // configure a file log sink

        fs::path fsDirectory { directory };
        if (!fs::exists(fsDirectory) && !fs::create_directories(fsDirectory))
        {
            throw std::runtime_error(
                "failed to create directory " + fsDirectory.string());
        }
        fs::path fsFile = fsDirectory / "weasel_%Y%m%d%H_%3N.log";

        boost::shared_ptr<bls::synchronous_sink<bls::text_file_backend>> sink1 = bl::add_file_log(
            blk::file_name = fsFile.string(),
            blk::auto_flush = true,
            blk::target = fsDirectory.string(),
            blk::rotation_size = 10 * 1024 * 1024,
            blk::time_based_rotation = bls::file::rotation_at_time_interval(
                boost::posix_time::hours(12)));
        sink1->set_formatter(
            ble::format("%1% <%2%> [%3%:%4%:%5%] %6%")
            % ble::format_date_time(timestamp, "%Y-%m-%d %H:%M:%S") % severity
            % ble::attr<std::string>("File") % ble::attr<uint32_t>("Line")
            % ble::attr<std::string>("Func") % ble::message);
        sink1->set_filter(severity >= level);
        bl::core::get()->add_sink(sink1);

        bl::add_common_attributes();
        _initialized = true;
    }

    /**
     *
     */
    void Logger::set_console_handler(const Level level)
    {
        namespace bl = boost::log;
        namespace ble = boost::log::expressions;

        // configure a console log sink

        const auto sink2 = bl::add_console_log();
        sink2->set_formatter(ble::stream << ble::message);
        sink2->set_filter(severity >= level);
        bl::core::get()->add_sink(sink2);

        bl::add_common_attributes();
        _initialized = true;
    }

    /**
     *
     */
    std::ostream& operator<<(std::ostream& strm, Logger::Level level)
    {
        strm << Logger::level_names.at(level);
        return strm;
    }

}} // namespace weasel::internal
