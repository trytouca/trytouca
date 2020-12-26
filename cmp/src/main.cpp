/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "options.hpp"
#include "fmt/printf.h"
#include "service.hpp"
#include "startup.hpp"
#include "weasel/devkit/logger.hpp"

/**
 *
 */
int main(int argc, char* argv[])
{
    Options options;

    // parse application options

    if (!parse_arguments(argc, argv, options))
    {
        return EXIT_FAILURE;
    }

    // we are done if user has asked for help

    if (options.help.has_value())
    {
        return EXIT_SUCCESS;
    }

    // initialize logger

    initialize_loggers(options);

    // setup communication with backend

    if (!run_startup_stage(options))
    {
        WEASEL_LOG_ERROR("failed during start-up stage");
        return EXIT_FAILURE;
    }

    Service service { options };

    if (service.run())
    {
        fmt::print(stdout, "successfully performed the required operation\n");
        return EXIT_SUCCESS;
    }

    fmt::print(stderr, "failed to run requested operation\n");
    return EXIT_FAILURE;
}
