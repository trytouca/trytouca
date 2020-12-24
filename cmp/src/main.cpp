/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "comparator/options.hpp"
#include "fmt/printf.h"
#include "service.hpp"

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

    Service service { options };

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
