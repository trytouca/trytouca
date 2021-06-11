// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#ifndef TOUCA_CATCH
#define CATCH_CONFIG_MAIN
#include "catch2/catch.hpp"
#else

#define CATCH_CONFIG_RUNNER
#include "catch2/catch.hpp"
#include "touca/touca.hpp"

int main(int argc, char* argv[])
{
    Catch::Session session;

    std::array<std::string, 3> touca_configure;

    const auto cli = session.cli()
        | Catch::clara::Opt(touca_configure[0], "api-key")["--api-key"]("touca api key")
        | Catch::clara::Opt(touca_configure[1], "api-url")["--api-url"]("touca api url")
        | Catch::clara::Opt(touca_configure[2], "revision")["--revision"]("revision of the code under test");

    session.cli(cli);

    const auto returnCode = session.applyCommandLine(argc, argv);
    if (returnCode != 0) {
        return returnCode;
    }

    touca::configure({ { "api-key", touca_configure[0] },
        { "api-url", touca_configure[1] },
        { "version", touca_configure[2] } });

    if (!touca::is_configured()) {
        std::cerr << "failed to configure Touca client:\n - "
                  << touca::configuration_error() << std::endl;
        return EXIT_FAILURE;
    }

    const auto exit_status = session.run();

    touca::post();

    return exit_status;
}

#endif
