/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "utils/operations.hpp"
#include <iostream>

/**
 *
 */
int main(int argc, char* argv[])
{
    // find appropriate operation based on provided command line arguments
    const auto operation = Operation::detect(argc, argv);

    // parse command line arguments with respect to identified operation
    // and further validate that values given for configuration parameters
    // satisfy prerequisites of the operation
    if (!operation->parse(argc, argv) || !operation->validate())
    {
        const auto& desc = operation->description();
        std::cerr << '\n'
                  << desc << std::endl;
        return EXIT_FAILURE;
    }

    // run the operation
    if (!operation->execute())
    {
        std::cerr << "failed to run operation" << std::endl;
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}
