/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "utils/operations.hpp"
#include "boost/filesystem.hpp"
#include "weasel/devkit/extra/logger.hpp"
#include <fmt/core.h>
#include <iostream>

/**
 *
 */
Operation::Mode detect_operational_mode(int argc, char* argv[])
{
    if (argc < 2)
    {
        return Operation::Mode::Unknown;
    }
    std::string arg(argv[1]);
    if (arg.rfind("--mode=", 0) == 0)
    {
        arg.assign(arg.substr(7));
    }
    const std::map<std::string, Operation::Mode> modes {
        { "compare", Operation::Mode::Compare },
        { "merge", Operation::Mode::Merge },
        { "post", Operation::Mode::Post },
        { "update", Operation::Mode::Update },
        { "view", Operation::Mode::View }
    };
    return modes.count(arg) ? modes.at(arg) : Operation::Mode::Unknown;
}

/**
 *
 */
std::shared_ptr<Operation> Operation::detect(int argc, char* argv[])
{
    const auto mode = detect_operational_mode(argc, argv);
    using func_t = std::function<std::shared_ptr<Operation>()>;
    std::map<Mode, func_t> ops {
        { Mode::Compare, &std::make_shared<CompareOperation> },
        { Mode::Merge, &std::make_shared<MergeOperation> },
        { Mode::Post, &std::make_shared<PostOperation> },
        { Mode::Update, &std::make_shared<UpdateOperation> },
        { Mode::View, &std::make_shared<ViewOperation> }
    };
    if (!ops.count(mode))
    {
        return std::make_shared<HelpOperation>();
    }
    return ops.at(mode)();
}

/**
 *
 */
Operation::Operation()
    : _opts({})
{
}

/**
 *
 */
bool Operation::validate_required_keys(
    const std::initializer_list<std::string>& keys) const
{
    const auto& missingKeys = _opts.findMissingKeys(keys);
    if (missingKeys.empty())
    {
        return true;
    }
    fmt::print(stderr, "required options are missing:\n");
    for (const auto& key : missingKeys)
    {
        fmt::print(stderr, "  - {}\n", key);
    }
    return false;
}

/**
 *
 */
bool Operation::validate_options() const
{
    return true;
}

/**
 *
 */
bool Operation::validate() const
{
    if (!validate_required_keys({ "log-level" }))
    {
        return false;
    }
    return validate_options();
}

/**
 *
 */
void Operation::parse_options(const boost::program_options::variables_map vm)
{
    std::ignore = vm;
}

/**
 *
 */
void Operation::parse_basic_options(
    const boost::program_options::variables_map& vm,
    const std::vector<std::string>& keys)
{
    for (const auto& key : keys)
    {
        if (vm.count(key))
        {
            _opts.add(key, vm.at(key).as<std::string>());
        }
    }
}

/**
 *
 */
bool Operation::parse(int argc, char* argv[])
{
    namespace po = boost::program_options;
    po::variables_map vm;
    auto desc = description();
    desc.add(HelpOperation().description());
    try
    {
        po::store(
            po::command_line_parser(argc, argv)
                .options(desc)
                //.allow_unregistered()
                .run(),
            vm);
        po::notify(vm);

        // update application-level options
        for (const auto& key : { "log-dir", "log-level", "log-to-console" })
        {
            if (vm.count(key))
            {
                _opts.add(key, vm.at(key).as<std::string>());
            }
        }

        // parse operation-specific options
        parse_options(vm);
        return true;
    }
    // if any of the required command line arguments are missing or
    // user has given invalid options
    catch (const std::exception& ex)
    {
        std::cerr << "invalid command line option(s): " << ex.what()
                  << std::endl;
    }
    return false;
}

bool Operation::execute() const
{
    namespace fs = boost::filesystem;
    using weasel::internal::Logger;
    if (!Logger::level_values.count(_opts.get("log-level")))
    {
        std::cerr << "log-level value is invalid" << std::endl;
        return false;
    }
    auto& logger = weasel::internal::Logger::instance();
    const auto level = Logger::level_values.at(_opts.get("log-level"));
    if (_opts.has("log-dir"))
    {
        const auto& logDir = _opts.get("log-dir");
        if (fs::exists(logDir) && !fs::is_directory(logDir))
        {
            std::cerr << "specified path for log directory leads to a file"
                      << std::endl;
            return false;
        }
        if (!fs::exists(logDir) && !fs::create_directories(logDir))
        {
            std::cerr << "failed to create log directory" << std::endl;
            return false;
        }

        logger.add_file_handler(logDir, level);
        WEASEL_LOG_INFO("Hello from Weasel Utils");
    }
    if (_opts.has("log-to-console")
        && 0 == _opts.get("log-to-console").compare("true"))
    {
        logger.set_console_handler(level);
    }
    return run();
}

/**
 *
 */
HelpOperation::HelpOperation()
    : Operation()
{
}

/**
 *
 */
boost::program_options::options_description HelpOperation::description() const
{
    namespace po = boost::program_options;
    // clang-format off
    po::options_description desc { "Options" };
    desc.add_options()
        ("help,h", "displays this help message")
        ("version,v", "version of this application")
        ("log-dir",
             po::value<std::string>(),
            "path to the directory to write log files into")
        ("log-level",  po::value<std::string>()->default_value("info"),
            "level of details to use for logging")
        ("log-to-console", po::value<std::string>()->implicit_value("true"),
            "prints log events to console")
        ("mode", po::value<std::string>(),
            "operational mode of this application [compare|merge|post|view]\n"
            "[compare]: shows comparison results of two given weasel result files\n"
            "[merge]: merges all result files in a given directory into one or multiple result files\n"
            "[post]: submits a given result file to the weasel platform\n"
            "[update]: updates one or more metadata fields of every message in every result file in a given directory"
            "[view]: shows content of a given weasel result file in json format\n");
    // clang-format on
    return desc;
}

/**
 *
 */
bool HelpOperation::run() const
{
    std::cout << description() << std::endl;
    return true;
}
