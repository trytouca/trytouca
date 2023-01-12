// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "fmt/core.h"
#include "operations.hpp"

int main(int argc, char* argv[]) {
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

  // create appropriate derived class

  const auto& operation = Operation::make(opts.mode);

  if (!operation || !operation->parse(argc, argv)) {
    return EXIT_FAILURE;
  }

  // execute operation

  if (!operation->run()) {
    return EXIT_FAILURE;
  }

  return EXIT_SUCCESS;
}
