/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "options.hpp"
#include "startup.hpp"
#include "weasel/devkit/logger.hpp"
#include "worker.hpp"
#include <thread>

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

    //

    Resources resources;
    std::vector<std::thread> workers;

    //

    workers.push_back(std::thread(collector, options, std::ref(resources)));

    //

    for (unsigned i = 0u; i < options.processor_threads; i++)
    {
        workers.push_back(std::thread(processor, options, std::ref(resources)));
    }

    //

    workers.push_back(std::thread(reporter, options, std::ref(resources)));

    //

    std::for_each(workers.begin(), workers.end(), [](auto& t) { t.join(); });

    //

    return EXIT_SUCCESS;
}
