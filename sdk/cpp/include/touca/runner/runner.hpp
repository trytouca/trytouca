// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

/**
 * @file runner.hpp
 *
 * @brief Entry-point to the C++ test framework.
 *
 * @details Test framework designed to abstract away many of the common features
 * expected of a regression test tool, such as parsing of command line arguments
 * and configuration files, logging, error handling, managing test results on
 * filesystem and submitting them to the Touca server.
 *
 * In most typical regression test tools, this function is meant to be called
 * from the application's `main` function, using the pattern shown below.
 *
 * @code
 *  int main(int argc, char* argv[]) {
 *    touca::workflow("is_prime", [](const std::string& testcase) {
 *      const auto number = std::stoul(testcase);
 *      touca::check("output", is_prime(number));
 *    });
 *    touca::run(argc, argv);
 *  }
 * @endcode
 */

#include <functional>
#include <string>

#include "touca/lib_api.hpp"

namespace touca {

TOUCA_CLIENT_API void workflow(
    const std::string& name,
    const std::function<void(const std::string&)> workflow);

TOUCA_CLIENT_API void run(int argc, char* argv[]);

}  // namespace touca
