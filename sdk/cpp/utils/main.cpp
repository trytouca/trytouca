/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "fmt/core.h"
#include "touca/devkit/logger.hpp"
#include "touca/devkit/utils.hpp"
#include "utils/operations.hpp"

/**
 *
 */
int main(int argc, char* argv[])
{
    CliOptions opts;

    // parse application options

    if (!opts.parse(argc, argv)) {
        return EXIT_FAILURE;
    }

    // we are done if user has asked for help

    if (opts.show_help || opts.show_version) {
        return EXIT_SUCCESS;
    }

    // we are done if specified command is invalid

    if (opts.mode == Operation::Command::unknown) {
        return EXIT_FAILURE;
    }

    // setup basic console logging

    if (!opts.log_level.empty()) {
        touca::setup_console_logger(opts.log_level);
    }

    // create appropriate derived class

    const auto& operation = Operation::make(opts.mode);

    if (!operation || !operation->parse(argc, argv)) {
        return EXIT_FAILURE;
    }

    // setup file logging

    if (!opts.log_dir.empty()) {
        touca::setup_file_logger(opts.log_dir);
    }

    // execute operation

    if (!operation->run()) {
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}
