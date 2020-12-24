/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "comparator/options.hpp"
#include "fmt/format.h"
#include "service.hpp"
#include "weasel/devkit/extra/logger.hpp"

/**
 *
 */
int main(int argc, char* argv[])
{
    Options options;

    // parse application options

    if (!options.parse(argc, argv))
    {
        return EXIT_FAILURE;
    }

    // we are done if user has asked for help

    if (options.arguments.help.has_value())
    {
        return EXIT_SUCCESS;
    }

    // initialize logger

    if (options.arguments.log_dir.has_value())
    {
        using weasel::internal::Logger;
        const auto level = Logger::level_values.at(options.arguments.log_level);
        auto& logger = weasel::internal::Logger::instance();
        logger.add_file_handler(options.arguments.log_dir.value(), level);
        logger.set_console_handler(level);
    }

    // initialize the comparator in service mode
    Service service { options };

    // initialize comparator in service mode
    if (!service.init())
    {
        fmt::print(stderr, "failed to initialize operation\n");
        return EXIT_FAILURE;
    }

    // start running the comparator.
    // note that the comparator runs as a service, periodically running
    // a task every few seconds. hence, we don't expect that the function
    // returns unless an interrupt signal hints that it has to stop.
    if (service.run())
    {
        fmt::print(stdout, "successfully performed the required operation\n");
        return EXIT_SUCCESS;
    }

    fmt::print(stderr, "failed to run requested operation\n");
    return EXIT_FAILURE;
}
