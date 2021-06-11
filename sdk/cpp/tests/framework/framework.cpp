// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/framework.hpp"
#include "catch2/catch.hpp"
#include "tests/client/devkit/tmpfile.hpp"
#include "tests/framework/utils.hpp"
#include "touca/devkit/utils.hpp"
#include "touca/extra/version.hpp"
#include "touca/framework/detail/utils.hpp"

TEST_CASE("suite")
{
    SECTION("dummy suite")
    {
        DummySuite suite;
        CHECK(suite.size() == 0);
        suite.initialize();
        CHECK(suite.size() == 0);
    }

    SECTION("simple suite")
    {
        SimpleSuite::Inputs inputs = { "4", "8", "15", "16", "23", "42" };
        SimpleSuite suite(inputs);
        CHECK(suite.size() == 0);
        suite.initialize();
        CHECK(suite.size() == 6);
        CHECK(std::equal(suite.begin(), suite.end(), inputs.begin()));
    }
}

TEST_CASE("workflow")
{
    SECTION("dummy workflow")
    {
        DummyWorkflow workflow;
        CHECK(workflow.suite());
        CHECK(workflow.suite()->size() == 0);
        CHECK(workflow.describe_options() == "Workflow specific help message");
        CHECK(workflow.validate_options());
        CHECK(workflow.initialize());
        CHECK(!workflow.skip("1"));
        CHECK(workflow.skip("case-to-exclude"));
        CHECK(!workflow.log_subscriber());
        CHECK_NOTHROW(workflow.add_options({ { "key", "value" } }));
    }

    SECTION("simple workflow")
    {
        CHECK(SimpleWorkflow().describe_options().empty());
    }
}

TEST_CASE("framework-dummy-workflow")
{
    MainCaller<DummyWorkflow> caller;
    TmpFile tmpFile;

    SECTION("help")
    {
        caller.call_with({ "--help" });
        CHECK(caller.exit_code() == EXIT_SUCCESS);
        CHECK_THAT(caller.cout(), Catch::Contains("Command Line Options"));
        CHECK_THAT(caller.cout(), Catch::Contains("Workflow specific help message"));
        CHECK(caller.cerr().empty());
    }

    SECTION("version")
    {
        caller.call_with({ "--version" });
        const auto expected = touca::format("{}.{}.{}\n", TOUCA_VERSION_MAJOR, TOUCA_VERSION_MINOR, TOUCA_VERSION_PATCH);
        CHECK(caller.exit_code() == EXIT_SUCCESS);
        CHECK(caller.cout() == expected);
        CHECK(caller.cerr().empty());
    }

    SECTION("noarg")
    {
        caller.call_with({});
        CHECK(caller.exit_code() == EXIT_FAILURE);
        CHECK(caller.cout().empty());
        CHECK_THAT(caller.cerr(), Catch::Contains("expected configuration options"));
        CHECK_THAT(caller.cerr(), Catch::Contains(" - revision"));
        CHECK_THAT(caller.cerr(), Catch::Contains(" - suite"));
        CHECK_THAT(caller.cerr(), Catch::Contains(" - team"));
    }

    SECTION("skip-post")
    {
        caller.call_with({ "--skip-post",
            "-r", "1.0", "-o", tmpFile.path.string(),
            "--team", "some-team", "--suite", "some-suite" });
        CHECK(caller.exit_code() == EXIT_FAILURE);
        CHECK_THAT(caller.cout(), Catch::Contains("Touca Regression Test Framework"));
        CHECK_THAT(caller.cout(), Catch::Contains("Suite: some-suite"));
        CHECK_THAT(caller.cout(), Catch::Contains("Revision: 1.0"));
        CHECK_THAT(caller.cout(), Catch::Contains("unable to proceed with empty list of testcases"));
        CHECK(caller.cerr().empty());
    }

    SECTION("single-testcase")
    {
        caller.call_with({ "--skip-post",
            "-r", "1.0", "-o", tmpFile.path.string(),
            "--team", "some-team", "--suite", "some-suite",
            "--testcase", "some-case", "--save-as-binary", "false" });
        CHECK(caller.exit_code() == EXIT_SUCCESS);
        CHECK_THAT(caller.cout(), Catch::Contains("1 of 1"));
        CHECK_THAT(caller.cout(), Catch::Contains("some-case"));
        CHECK_THAT(caller.cout(), Catch::Contains("(pass,"));
        CHECK_THAT(caller.cout(), Catch::Contains("processed 1 of 1 testcases"));
        CHECK(caller.cerr().empty());
    }

    SECTION("api-url")
    {
        caller.call_with({ "--skip-post",
            "-r", "1.0", "-o", tmpFile.path.string(),
            "--api-url", "http://localhost/api/@/some-team/some-suite",
            "--testcase", "some-case", "--save-as-binary", "false" });
        CHECK(caller.exit_code() == EXIT_SUCCESS);
        CHECK_THAT(caller.cout(), Catch::Contains("1 of 1"));
        CHECK_THAT(caller.cout(), Catch::Contains("some-case"));
        CHECK_THAT(caller.cout(), Catch::Contains("(pass,"));
        CHECK_THAT(caller.cout(), Catch::Contains("processed 1 of 1 testcases"));
        CHECK(caller.cerr().empty());
    }

    SECTION("invalid-config-file")
    {
        TmpFile configFile;
        configFile.write(R"("Hello")");
        caller.call_with({ "--skip-post",
            "-r", "1.0", "-o", tmpFile.path.string(),
            "--config-file", configFile.path.string() });
        CHECK(caller.exit_code() == EXIT_FAILURE);
        CHECK(caller.cout().empty());
        CHECK_THAT(caller.cerr(), Catch::Contains("expected configuration file to be a json object"));
        CHECK_THAT(caller.cerr(), Catch::Contains("Command Line Options"));
    }

    SECTION("valid-config-file")
    {
        TmpFile configFile;
        configFile.write(R"({ "framework": { "save-as-binary": "false", "save-as-json": "false", "skip-logs": "true", "log-level": "error", "overwrite": "false" }, "touca": { "api-key": "03dda763-62ea-436f-8395-f45296e56e4b", "api-url": "https://api.touca.io/@/some-team/some-suite" }, "workflow": { "custom-key": "custom-value" } })");
        caller.call_with({ "--skip-post",
            "-r", "1.0", "-o", tmpFile.path.string(),
            "--config-file", configFile.path.string(),
            "--testcase", "some-case" });
        CHECK(caller.exit_code() == EXIT_SUCCESS);
        CHECK_THAT(caller.cout(), Catch::Contains("Suite: some-suite"));
        CHECK_THAT(caller.cout(), Catch::Contains("Revision: 1.0"));
        CHECK_THAT(caller.cout(), Catch::Contains("1 of 1"));
        CHECK_THAT(caller.cout(), Catch::Contains("some-case"));
        CHECK_THAT(caller.cout(), Catch::Contains("(pass,"));
        CHECK_THAT(caller.cout(), Catch::Contains("processed 1 of 1 testcases"));
        CHECK(caller.cerr().empty());
    }
}

TEST_CASE("framework-simple-workflow-valid-use")
{
    using fnames = std::vector<touca::filesystem::path>;

    MainCaller<SimpleWorkflow> caller;
    TmpFile outputDir;
    TmpFile configFile;
    configFile.write(R"({ "touca": { "api-url": "https://api.touca.io/@/some-team/some-suite" }, "workflow": { "custom-key": "custom-value" } })");

    caller.call_with({ "--skip-post",
        "-r", "1.0", "-o", outputDir.path.string(),
        "--config-file", configFile.path.string(),
        "--save-as-json", "true" });

    SECTION("first-run")
    {
        CHECK(caller.exit_code() == EXIT_SUCCESS);
        CHECK_THAT(caller.cout(), Catch::Contains("Suite: some-suite"));
        CHECK_THAT(caller.cout(), Catch::Contains("Revision: 1.0"));
        CHECK_THAT(caller.cout(), Catch::Contains("(  5 of 6  ) 23                               (pass, 0 ms)"));
        CHECK_THAT(caller.cout(), Catch::Contains("(  6 of 6  ) 42                               (fail, 0 ms)"));
        CHECK_THAT(caller.cout(), Catch::Contains("- some-error"));
        CHECK_THAT(caller.cout(), Catch::Contains("processed 5 of 6 testcases"));
        CHECK_THAT(caller.cout(), Catch::Contains("test completed in"));
        CHECK(caller.cerr().empty());
    }

    SECTION("second-run-without-overwrite")
    {
        caller.call_with({ "--skip-post",
            "-r", "1.0", "-o", outputDir.path.string(),
            "--config-file", configFile.path.string(),
            "--save-as-json", "true" });

        CHECK(caller.exit_code() == EXIT_SUCCESS);
        CHECK_THAT(caller.cout(), Catch::Contains("Suite: some-suite"));
        CHECK_THAT(caller.cout(), Catch::Contains("Revision: 1.0"));
        CHECK_THAT(caller.cout(), Catch::Contains("(  5 of 6  ) 23                               (skip)"));
        CHECK_THAT(caller.cout(), Catch::Contains("(  6 of 6  ) 42                               (fail, 0 ms)"));
        CHECK_THAT(caller.cout(), Catch::Contains("- some-error"));
        CHECK_THAT(caller.cout(), Catch::Contains("skipped 5 of 6 testcases"));
        CHECK_THAT(caller.cout(), Catch::Contains("processed 0 of 6 testcases"));
        CHECK_THAT(caller.cout(), Catch::Contains("test completed in"));
        CHECK(caller.cerr().empty());
    }

    SECTION("second-run-with-overwrite")
    {
        caller.call_with({ "--skip-post",
            "-r", "1.0", "-o", outputDir.path.string(),
            "--config-file", configFile.path.string(),
            "--save-as-json", "true", "--overwrite" });

        CHECK(caller.exit_code() == EXIT_SUCCESS);
        CHECK_THAT(caller.cout(), Catch::Contains("Suite: some-suite"));
        CHECK_THAT(caller.cout(), Catch::Contains("Revision: 1.0"));
        CHECK_THAT(caller.cout(), Catch::Contains("(  5 of 6  ) 23                               (pass, 0 ms)"));
        CHECK_THAT(caller.cout(), Catch::Contains("(  6 of 6  ) 42                               (fail, 0 ms)"));
        CHECK_THAT(caller.cout(), Catch::Contains("- some-error"));
        CHECK_THAT(caller.cout(), Catch::Contains("processed 5 of 6 testcases"));
        CHECK_THAT(caller.cout(), Catch::Contains("test completed in"));
        CHECK(caller.cerr().empty());
    }

    SECTION("directory-structure")
    {
        fnames suiteFiles = ResultChecker(fnames({ outputDir.path })).get_regular_files("some-suite");
        fnames suiteDirs = ResultChecker(fnames({ outputDir.path })).get_directories("some-suite");
        CHECK(suiteFiles.empty());
        CHECK_THAT(suiteDirs, Catch::UnorderedEquals(fnames({ "1.0" })));

        fnames revisionFiles = ResultChecker(fnames({ outputDir.path, "some-suite" })).get_regular_files("1.0");
        fnames revisionDirs = ResultChecker(fnames({ outputDir.path, "some-suite" })).get_directories("1.0");
        CHECK_THAT(revisionFiles, Catch::UnorderedEquals(fnames({ "Console.log", "touca.log" })));
        CHECK_THAT(revisionDirs, Catch::UnorderedEquals(fnames({ "42", "23", "16", "15", "8", "4" })));

        fnames caseFiles = ResultChecker(fnames({ outputDir.path, "some-suite", "1.0" })).get_regular_files("15");
        fnames caseDirs = ResultChecker(fnames({ outputDir.path, "some-suite", "1.0" })).get_directories("15");
        CHECK_THAT(caseFiles, Catch::UnorderedEquals(fnames({ "touca.json", "touca.bin" })));
        CHECK_THAT(caseDirs, Catch::UnorderedEquals(fnames({})));
    }

    SECTION("directory-content-streams")
    {
        fnames caseFiles = ResultChecker(fnames({ outputDir.path, "some-suite", "1.0" })).get_regular_files("8");
        REQUIRE_THAT(caseFiles, Catch::UnorderedEquals(fnames({ "stdout.txt", "stderr.txt", "touca.json", "touca.bin" })));
        touca::filesystem::path caseDir = outputDir.path;
        caseDir = caseDir / "some-suite" / "1.0" / "8";
        const auto& fileOut = touca::load_string_file((caseDir / "stdout.txt").string());
        CHECK(fileOut == "simple message in output stream\n");
        const auto& fileErr = touca::load_string_file((caseDir / "stderr.txt").string());
        CHECK(fileErr == "simple message in error stream\n");
    }

    SECTION("directory-content-json")
    {
        fnames caseFiles = ResultChecker(fnames({ outputDir.path, "some-suite", "1.0" })).get_regular_files("4");
        REQUIRE_THAT(caseFiles, Catch::UnorderedEquals(fnames({ "touca.json", "touca.bin" })));
        touca::filesystem::path caseDir = outputDir.path;
        caseDir = caseDir / "some-suite" / "1.0" / "4";
        const auto& fileJson = touca::load_string_file((caseDir / "touca.json").string());
        CHECK_THAT(fileJson, Catch::Contains(R"("teamslug":"some-team","testsuite":"some-suite","version":"1.0","testcase":"4")"));
        CHECK_THAT(fileJson, Catch::Contains(R"({"key":"some-number","value":"1024"})"));
        CHECK_THAT(fileJson, Catch::Contains(R"({"key":"some-string","value":"foo"})"));
        CHECK_THAT(fileJson, Catch::Contains(R"("assertion":[])"));
        CHECK_THAT(fileJson, Catch::Contains(R"("metrics":[])"));
    }
}

TEST_CASE("framework-stream-redirection-disabled")
{
    using fnames = std::vector<touca::filesystem::path>;

    MainCaller<SimpleWorkflow> caller;
    TmpFile outputDir;
    TmpFile configFile;
    configFile.write(R"({ "touca": { "api-url": "https://api.touca.io/@/some-team/some-suite" }, "workflow": { "custom-key": "custom-value" } })");

    caller.call_with({ "--skip-post",
        "-r", "1.0", "-o", outputDir.path.string(),
        "--config-file", configFile.path.string(),
        "--stream-redirection", "false" });

    SECTION("directory-content-streams")
    {
        fnames caseFiles = ResultChecker(fnames({ outputDir.path, "some-suite", "1.0" })).get_regular_files("8");
        REQUIRE_THAT(caseFiles, Catch::UnorderedEquals(fnames({ "touca.bin" })));
    }
}
