/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#ifndef WEASEL_CATCH
#define CATCH_CONFIG_MAIN
#include "catch2/catch.hpp"
#else

#define CATCH_CONFIG_RUNNER
#include "catch2/catch.hpp"
#include "weasel/weasel.hpp"

int main(int argc, char* argv[])
{
    Catch::Session session;

    std::array<std::string, 3> weasel_configure;

    const auto cli = session.cli()
        | Catch::clara::Opt(weasel_configure[0], "api-key")["--api-key"]("weasel api key")
        | Catch::clara::Opt(weasel_configure[1], "api-url")["--api-url"]("weasel api url")
        | Catch::clara::Opt(weasel_configure[2], "revision")["--revision"]("revision of the code under test");

    session.cli(cli);

    const auto returnCode = session.applyCommandLine(argc, argv);
    if (returnCode != 0)
    {
        return returnCode;
    }

    weasel::configure({ { "api-key", weasel_configure[0] },
                        { "api-url", weasel_configure[1] },
                        { "version", weasel_configure[2] } });

    const auto exit_status = session.run();

    weasel::post();

    return exit_status;
}

#endif
