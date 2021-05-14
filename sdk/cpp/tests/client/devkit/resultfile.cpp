/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "touca/devkit/resultfile.hpp"
#include "catch2/catch.hpp"
#include "tmpfile.hpp"
#include "touca/devkit/utils.hpp"

std::vector<touca::Testcase> make_cases()
{
    const auto firstname = std::make_shared<touca::types::String>("harry");
    const auto lastname = std::make_shared<touca::types::String>("potter");
    touca::Testcase tc("hogwarts", "wizards", "1.0", "hpotter");
    tc.add_result("firstname", firstname);
    tc.add_result("lastname", lastname);
    return { tc };
}

void compare_cases(
    const std::vector<touca::Testcase>& tmpCases,
    const touca::ElementsMap& parsedCases)
{
    REQUIRE(parsedCases.size() == tmpCases.size());
    const auto serialize = [](const touca::Testcase& tc) {
        const auto v = tc.flatbuffers();
        return std::string(v.begin(), v.end());
    };
    auto i = 0u;
    for (const auto& kvp : parsedCases) {
        const auto parsedCase = serialize(*kvp.second);
        const auto tmpCase = serialize(tmpCases.at(i));
        REQUIRE(parsedCase.compare(tmpCase) == 0);
        ++i;
    }
}

TEST_CASE("Result File Operations")
{
    TmpFile tmpFile;
    touca::ResultFile resultFile(tmpFile.path);

    /**
     * when ResultFile does not correspond to an already existing file on the
     * filesystem with valid results, it should not pass the validation check.
     */
    SECTION("validate empty file")
    {
        REQUIRE_FALSE(resultFile.validate());
    }

    SECTION("stored result file")
    {
        const auto tcs = make_cases();
        const auto tcs_binary = touca::Testcase::serialize(tcs);
        const std::string tcs_buffer { tcs_binary.begin(), tcs_binary.end() };
        REQUIRE_NOTHROW(resultFile.save(tcs));

        /*
         * A newly saved file should pass validation check.
         */
        SECTION("validate saved file")
        {
            REQUIRE(resultFile.validate());
        }

        /**
         * read back testcases frmo the result file
         */
        SECTION("parse")
        {
            REQUIRE_NOTHROW(resultFile.parse());

            const auto parsedCases = resultFile.parse();
            compare_cases(tcs, parsedCases);
        }

        /**
         * Parse the result file into string in json format
         */
        SECTION("readFileInJson")
        {
            const auto tmpJson = resultFile.readFileInJson();
            const auto expected = R"~("results":[{"key":"firstname","value":"harry"},{"key":"lastname","value":"potter"}],"assertion":[],"metrics":[])~";
            REQUIRE_THAT(tmpJson, Catch::Contains(expected));
        }

        /**
         * Load a ResultFile object with content from a saved file.
         */
        SECTION("load")
        {
            touca::ResultFile newResultFile(tmpFile.path);
            REQUIRE_NOTHROW(newResultFile.load());
            REQUIRE(newResultFile.isLoaded());

            REQUIRE_NOTHROW(newResultFile.parse());
            const auto parsedCases = newResultFile.parse();
            compare_cases(tcs, parsedCases);
        }

        /**
         * Compare a result file with another result file.
         */
        SECTION("compare")
        {
            touca::ResultFile newResultFile(tmpFile.path);
            REQUIRE_NOTHROW(newResultFile.load());

            REQUIRE_NOTHROW(newResultFile.compare(resultFile));
            const auto cmp = newResultFile.compare(resultFile);

            SECTION("basic-metadata")
            {
                CHECK(cmp.fresh.empty());
                CHECK(cmp.missing.empty());
                CHECK(cmp.common.size() == 1u);
                REQUIRE(cmp.common.count("hpotter") == 1u);
            }

            SECTION("json-representation")
            {
                const auto& output = cmp.json();
                const auto& check1 = R"~({"newCases":[],"missingCases":[])~";
                const auto& check2 = R"~("metrics":{"commonKeys":[],"missingKeys":[],"newKeys":[]})~";
                const auto& check3 = R"~("assertions":{"commonKeys":[],"missingKeys":[],"newKeys":[]})~";
                CHECK_THAT(output, Catch::Contains(check1));
                CHECK_THAT(output, Catch::Contains(check2));
                CHECK_THAT(output, Catch::Contains(check3));
            }
        }
    }
}
