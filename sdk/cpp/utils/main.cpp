/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "fmt/core.h"
#include "utils/operations.hpp"
#include "weasel/devkit/utils.hpp"

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

    if (options.arguments.show_help || options.arguments.show_version)
    {
        return EXIT_SUCCESS;
    }

    // we are done if specified command is invalid

    if (options.arguments.mode == Operation::Command::unknown)
    {
        return EXIT_FAILURE;
    }

    // setup basic console logging

    if (!options.arguments.log_level.empty())
    {
        // ...
    }

    // create appropriate derived class

    const auto& operation = Operation::make(options.arguments.mode);

    if (!operation || !operation->parse(argc, argv))
    {
        return EXIT_FAILURE;
    }

    // setup file logging

    if (!options.arguments.log_dir.empty())
    {
        // ...
    }

    // execute operation

    if (operation->run())
    {
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}
