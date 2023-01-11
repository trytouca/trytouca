// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#ifndef TOUCA_CATCH
#define CATCH_CONFIG_MAIN
#include "catch2/catch.hpp"
#else

#define CATCH_CONFIG_RUNNER
#include <array>

#include "catch2/catch.hpp"
#include "touca/touca.hpp"

int main(int argc, char* argv[]) {
  Catch::Session session;
  std::array<std::string, 3> touca_configure;

  const auto cli =
      session.cli() |
      Catch::clara::Opt(touca_configure[0],
                        "api-key")["--api-key"]("Touca API Key") |
      Catch::clara::Opt(touca_configure[1],
                        "api-url")["--api-url"]("Touca API URL") |
      Catch::clara::Opt(touca_configure[2], "revision")["--revision"](
          "version of the code under test");
  session.cli(cli);

  const auto returnCode = session.applyCommandLine(argc, argv);
  if (returnCode != 0) {
    return returnCode;
  }

  if (std::any_of(touca_configure.begin(), touca_configure.end(),
                  [](const std::string& x) { return x.empty(); })) {
    std::cerr << "Touca is not configured. This tool expects config options "
                 "`--api-key`, `--api-url`, and `--revision` to be passed as "
                 "command-line arguments. Use `--help` to learn more."
              << std::endl;
    return EXIT_FAILURE;
  }

  touca::configure([&touca_configure](touca::ClientOptions& x) {
    x.api_key = touca_configure[0];
    x.api_url = touca_configure[1];
    x.version = touca_configure[2];
  });

  if (!touca::is_configured()) {
    std::cerr << "failed to configure Touca client:\n - "
              << touca::configuration_error() << std::endl;
    return EXIT_FAILURE;
  }

  const auto exit_status = session.run();
  touca::post();
  touca::seal();
  return exit_status;
}

#endif
