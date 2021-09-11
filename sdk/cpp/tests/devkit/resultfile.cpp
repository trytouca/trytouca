// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/devkit/resultfile.hpp"
#include "catch2/catch.hpp"
#include "tmpfile.hpp"
#include "touca/devkit/utils.hpp"

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
        touca::Testcase tc("acme", "students", "1.0", "aanderson");
        tc.add_result("firstname", std::make_shared<touca::types::String>("alice"));
        tc.add_result("lastname", std::make_shared<touca::types::String>("anderson"));
        REQUIRE_NOTHROW(resultFile.save({ tc }));

        /*
         * A newly saved file should pass validation check.
         */
        SECTION("validate saved file")
        {
            REQUIRE(resultFile.validate());
        }

        SECTION("calling validate without load should implicitly load")
        {
            touca::ResultFile newResultFile(tmpFile.path);
            REQUIRE(newResultFile.validate());
        }

        /**
         * read back testcases from the result file
         */
        SECTION("parse")
        {
            const auto parsedCases = resultFile.parse();
            compare_cases({ tc }, parsedCases);
        }

        /**
         * Parse the result file into string in json format
         */
        SECTION("calling readFileInJson on loaded file will not re-parse file")
        {
            const auto tmpJson = resultFile.readFileInJson();
            const auto expected = R"~("results":[{"key":"firstname","value":"alice"},{"key":"lastname","value":"anderson"}],"assertion":[],"metrics":[])~";
            REQUIRE_THAT(tmpJson, Catch::Contains(expected));
        }

        SECTION("calling readFileInJson without load should implicitly parse")
        {
            touca::ResultFile newResultFile(tmpFile.path);
            const auto tmpJson = newResultFile.readFileInJson();
            const auto expected = R"~("results":[{"key":"firstname","value":"alice"},{"key":"lastname","value":"anderson"}],"assertion":[],"metrics":[])~";
            REQUIRE_THAT(tmpJson, Catch::Contains(expected));
        }

        SECTION("merge")
        {
            TmpFile newTmpFile;
            touca::ResultFile newResultFile(newTmpFile.path);
            REQUIRE_NOTHROW(newResultFile.merge(resultFile));
            REQUIRE(newResultFile.validate());
            REQUIRE_NOTHROW(newResultFile.save());
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
            compare_cases({ tc }, parsedCases);
        }

        /**
         * Compare two result files that have the same content.
         */
        SECTION("compare_files_with_same_cases")
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
                REQUIRE(cmp.common.count("aanderson") == 1u);
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

        /**
         * Compare two result files that have different content.
         */
        SECTION("compare_files_with_different_cases")
        {
            TmpFile newTmpFile;

            touca::ResultFile newResultFile(newTmpFile.path);
            touca::Testcase tc_dst("acme", "students", "1.0", "bbrown");
            tc_dst.add_result("firstname", std::make_shared<touca::types::String>("bob"));
            tc_dst.add_result("lastname", std::make_shared<touca::types::String>("brown"));
            REQUIRE_NOTHROW(newResultFile.save({ tc_dst }));

            touca::ResultFile newResultFile2(newTmpFile.path);
            REQUIRE_NOTHROW(newResultFile2.compare(resultFile));
            const auto cmp = newResultFile2.compare(resultFile);

            SECTION("basic-metadata")
            {
                CHECK(cmp.fresh.size() == 1u);
                CHECK(cmp.missing.size() == 1u);
                REQUIRE(cmp.fresh.count("bbrown") == 1u);
                REQUIRE(cmp.missing.count("aanderson") == 1u);
            }

            SECTION("json-representation")
            {
                const auto& output = cmp.json();
                const auto& check1 = R"~(,"commonCases":[]})~";
                const auto& check2 = R"~("missingCases":[{"teamslug":"acme","testsuite":"students","version":"1.0","testcase":"aanderson","builtAt":)~";
                const auto& check3 = R"~({"newCases":[{"teamslug":"acme","testsuite":"students","version":"1.0","testcase":"bbrown","builtAt":)~";
                CHECK_THAT(output, Catch::Contains(check1));
                CHECK_THAT(output, Catch::Contains(check2));
                CHECK_THAT(output, Catch::Contains(check3));
            }
        }
    }
}
