/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "utils/operations.hpp"
#include "cxxopts.hpp"
#include "touca/devkit/utils.hpp"
#include "touca/extra/version.hpp"

/**
 *
 */
Operation::Command Operation::find_mode(const std::string& name)
{
    const std::unordered_map<std::string, Operation::Command> modes {
        { "compare", Operation::Command::compare },
        { "merge", Operation::Command::merge },
        { "post", Operation::Command::post },
        { "update", Operation::Command::update },
        { "view", Operation::Command::view }
    };
    return modes.count(name) ? modes.at(name) : Operation::Command::unknown;
}

/**
 *
 */
std::shared_ptr<Operation> Operation::make(const Operation::Command& mode)
{
    using func_t = std::function<std::shared_ptr<Operation>()>;
    std::map<Operation::Command, func_t> ops {
        { Operation::Command::compare, &std::make_shared<CompareOperation> },
        { Operation::Command::merge, &std::make_shared<MergeOperation> },
        { Operation::Command::post, &std::make_shared<PostOperation> },
        { Operation::Command::update, &std::make_shared<UpdateOperation> },
        { Operation::Command::view, &std::make_shared<ViewOperation> }
    };
    if (!ops.count(mode)) {
        touca::print_error("operation not implemented: {}\n", mode);
        return nullptr;
    }
    return ops.at(mode)();
}

/**
 *
 */
bool Operation::parse(int argc, char* argv[])
{
    try {
        return parse_impl(argc, argv);
    } catch (const std::exception& ex) {
        touca::print_error("failed to parse operation options: {}\n", ex.what());
    }
    return false;
}

/**
 *
 */
bool Operation::run() const
{
    try {
        return run_impl();
    } catch (const std::exception& ex) {
        touca::print_error("failed to run operation: {}\n", ex.what());
    }
    return false;
}

/**
 *
 */
cxxopts::Options config_options_main()
{
    cxxopts::Options options("touca_cli");
    // clang-format off
    options.add_options("main")
        ("h,help", "displays this help message")
        ("v,version", "prints version of this executable")
        ("m,mode", "operational mode of this application", cxxopts::value<std::string>())
        ("log-dir", "relative path to log directory", cxxopts::value<std::string>())
        ("log-level", "level of detail to use for logging", cxxopts::value<std::string>()->default_value("warning"));
    // clang-format on
    options.parse_positional("mode");
    options.allow_unrecognised_options();
    return options;
}

/**
 *
 */
bool CliOptions::parse(int argc, char* argv[])
{
    try {
        return parse_impl(argc, argv);
    } catch (const std::exception& ex) {
        touca::print_error("failed to parse application options: {}\n", ex.what());
    }
    return false;
}

/**
 *
 */
bool CliOptions::parse_impl(int argc, char* argv[])
{
    // parse command line arguments

    auto options = config_options_main();
    const auto& result = options.parse(argc, argv);

    // if user asks for help, print help message and exit

    if (result.count("help")) {
        fmt::print(stdout, "{}\n", options.show_positional_help().help());
        show_help = true;
        return true;
    }

    // if user asks for version, print application version and exit
    // @todo add a version.hpp to touca/devkit and use major/minor/patch below

    if (result.count("version")) {
        fmt::print(stdout, "Touca Utility Command Line Tool v{}.{}.{}\n", TOUCA_VERSION_MAJOR, TOUCA_VERSION_MINOR, TOUCA_VERSION_PATCH);
        show_version = true;
        return true;
    }

    // validate and set option `mode`

    if (!result.count("mode")) {
        touca::print_error("no command was specified\n");
        fmt::print(stderr, "{}\n", options.show_positional_help().help());
        return false;
    }

    const auto mode_name = result["mode"].as<std::string>();
    mode = Operation::find_mode(mode_name);

    if (mode == Operation::Command::unknown) {
        touca::print_error("provided command `{}` is invalid\n", mode_name);
        fmt::print(stderr, "{}\n", options.show_positional_help().help());
        return false;
    }

    // validate and set option `log-level`

    {
        // setup console logging with appropriate log level
        const std::unordered_set<std::string> levels = { "debug", "info", "warning" };
        const auto level = result["log-level"].as<std::string>();
        if (!levels.count(level)) {
            touca::print_error("invalid value for option `log-level`");
            fmt::print("{}\n", options.show_positional_help().help());
            return false;
        }
        log_level = level;
    }

    // set option `log-dir` if it is provided

    if (result.count("log-dir")) {
        log_dir = result["log-dir"].as<std::string>();
    }

    return true;
}
