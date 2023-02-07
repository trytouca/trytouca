// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/runner/runner.hpp"

#include <iostream>

#include "catch2/catch.hpp"
#include "fmt/ostream.h"
#include "fmt/printf.h"
#include "tests/core/shared.hpp"
#include "touca/core/config.hpp"
#include "touca/runner/detail/helpers.hpp"
#include "touca/touca.hpp"

const auto dummy_workflow = [](const std::string& testcase) {};

const auto simple_workflow = [](const std::string& testcase) {
  if (testcase == "8") {
    std::cout << "simple message in output stream" << std::endl;
    std::cerr << "simple message in error stream" << std::endl;
  }
  if (testcase == "42") {
    throw std::runtime_error("some-error");
  }
  if (testcase == "4") {
    touca::check("some-number", 1024);
    touca::check("some-string", "foo");
    touca::add_array_element("some-array", "bar");
  }
};

struct MainCaller {
  void call_with(const std::vector<std::string>& args) {
    std::vector<char*> argv;
    argv.push_back((char*)"myapp");
    for (const auto& arg : args) {
      argv.push_back((char*)arg.data());
    }
    argv.push_back(nullptr);

#if (defined(_POSIX_C_SOURCE) && _POSIX_C_SOURCE >= 200112L) || \
    defined(__APPLE__)
    auto tmpDir = TmpFile().path.parent_path();
    setenv("TOUCA_HOME_DIR", tmpDir.string().c_str(), 1);
#endif

    capturer.start_capture();
    exit_status = touca::run(argv.size() - 1, argv.data());
    capturer.stop_capture();

#if (defined(_POSIX_C_SOURCE) && _POSIX_C_SOURCE >= 200112L) || \
    defined(__APPLE__)
    unsetenv("TOUCA_HOME_DIR");
#endif
  }

  inline int exit_code() const { return exit_status; }
  inline std::string cerr() const { return capturer.cerr(); }
  inline std::string cout() const { return capturer.cout(); }

 private:
  int exit_status = 0;
  touca::detail::OutputCapturer capturer;
};

struct ResultChecker {
 public:
  ResultChecker(const std::vector<touca::filesystem::path>& segments) {
    _path = segments.front();
    for (auto i = 1ul; i < segments.size(); i++) {
      _path /= segments[i];
    }
  }

  std::vector<touca::filesystem::path> get_regular_files(
      const std::string& filename) const {
    return get_elements(filename, [](const touca::filesystem::path& path) {
      return touca::filesystem::is_regular_file(path);
    });
  }

  std::vector<touca::filesystem::path> get_directories(
      const std::string& filename) const {
    return get_elements(filename, [](const touca::filesystem::path& path) {
      return touca::filesystem::is_directory(path);
    });
  }

 private:
  std::vector<touca::filesystem::path> get_elements(
      const std::string& filename,
      const std::function<bool(touca::filesystem::path)> filter) const {
    std::vector<touca::filesystem::path> filenames;
    for (const auto& entry :
         touca::filesystem::directory_iterator(_path / filename)) {
      if (filter(entry.path())) {
        filenames.emplace_back(entry.path().filename());
      }
    }
    return filenames;
  }

  touca::filesystem::path _path;
};

TEST_CASE("runner-dummy-workflow") {
  touca::workflow("dummy_workflow", dummy_workflow);
  MainCaller caller;
  TmpFile tmpFile;

  SECTION("help") {
    caller.call_with({"--help"});
    CHECK(caller.exit_code() == EXIT_SUCCESS);
    CHECK_THAT(caller.cout(), Catch::Contains("Command Line Options"));
    CHECK(caller.cerr().empty());
  }

  SECTION("version") {
    caller.call_with({"--version"});
    const auto expected =
        touca::detail::format("v{}.{}.{}\n", TOUCA_VERSION_MAJOR,
                              TOUCA_VERSION_MINOR, TOUCA_VERSION_PATCH);
    CHECK(caller.exit_code() == EXIT_SUCCESS);
    CHECK(caller.cout() == expected);
    CHECK(caller.cerr().empty());
  }

  SECTION("no-arguments") {
    caller.call_with({});
    CHECK(caller.exit_code() == EXIT_FAILURE);
    CHECK(caller.cout().empty());
    CHECK_THAT(caller.cerr(),
               Catch::Contains("Failed to configure the test runner"));
    CHECK_THAT(caller.cerr(),
               Catch::Contains("Configuration option \"revision\" is missing "
                               "for one or more workflows."));
  }

  SECTION("missing testcases") {
    caller.call_with({"--offline", "--revision", "1.0", "--output-directory",
                      tmpFile.path.string(), "--team", "some-team", "--suite",
                      "some-suite"});
    CHECK(caller.exit_code() == EXIT_FAILURE);
    CHECK(caller.cout().empty());
    CHECK_THAT(caller.cerr(),
               Catch::Contains("Failed to configure the test runner"));
    CHECK_THAT(caller.cerr(),
               Catch::Contains("Configuration option \"testcases\" is missing "
                               "for one or more workflows."));
  }

  SECTION("single-testcase") {
    caller.call_with({"--offline", "--revision", "1.0", "--output-directory",
                      tmpFile.path.string(), "--team", "some-team", "--suite",
                      "some-suite", "--testcase", "some-case",
                      "--save-as-binary", "false", "--colored-output=false"});
    CHECK(caller.exit_code() == EXIT_SUCCESS);
    CHECK_THAT(caller.cout(),
               Catch::Contains("1.  PASS   some-case    (0 ms)"));
    CHECK_THAT(caller.cout(), Catch::Contains("1 passed, 1 total"));
    CHECK_THAT(caller.cout(), Catch::Contains("Ran all test suites."));
    CHECK(caller.cerr().empty());
  }

  SECTION("api-url") {
    caller.call_with({"--offline", "--revision", "1.0", "--output-directory",
                      tmpFile.path.string(), "--api-url",
                      "http://localhost/api/@/some-team/some-suite",
                      "--testcase", "some-case", "--save-as-binary", "false",
                      "--colored-output=false"});
    CHECK(caller.exit_code() == EXIT_SUCCESS);
    CHECK_THAT(caller.cout(),
               Catch::Contains("1.  PASS   some-case    (0 ms)"));
    CHECK_THAT(caller.cout(), Catch::Contains("1 passed, 1 total"));
    CHECK_THAT(caller.cout(), Catch::Contains("Ran all test suites."));
    CHECK(caller.cerr().empty());
  }

  SECTION("invalid-config-file") {
    TmpFile configFile;
    configFile.write(R"("Hello")");
    caller.call_with({"--offline", "--revision", "1.0", "--output-directory",
                      tmpFile.path.string(), "--config-file",
                      configFile.path.string()});
    CHECK(caller.exit_code() == EXIT_FAILURE);
    CHECK(caller.cout().empty());
    CHECK_THAT(caller.cerr(),
               Catch::Contains("Failed to configure the test runner"));
    CHECK_THAT(
        caller.cerr(),
        Catch::Contains("Expected configuration file to be a json object"));
  }

  SECTION("valid-config-file") {
    TmpFile configFile;
    configFile.write(
        R"({ "touca": { "api-key": "03dda763-62ea-436f-8395-f45296e56e4b", "api-url": "https://api.touca.io/@/some-team/some-suite", "save-as-binary": false, "save-as-json": false, "skip-logs": true, "log-level": "warning", "overwrite": false }, "custom-key": "custom-value" })");
    caller.call_with({"--offline", "--revision", "1.0", "--output-directory",
                      tmpFile.path.string(), "--config-file",
                      configFile.path.string(), "--testcase", "some-case",
                      "--colored-output=false"});
    CHECK(caller.exit_code() == EXIT_SUCCESS);
    CHECK_THAT(caller.cout(), Catch::Contains("Suite: some-suite/1.0"));
    CHECK_THAT(caller.cout(),
               Catch::Contains("1.  PASS   some-case    (0 ms)"));
    CHECK_THAT(caller.cout(), Catch::Contains("1 passed, 1 total"));
    CHECK_THAT(caller.cout(), Catch::Contains("Ran all test suites."));
    CHECK(caller.cerr().empty());
  }
  touca::detail::reset_test_runner();
}

TEST_CASE("runner-simple-workflow-valid-use") {
  using fnames = std::vector<touca::filesystem::path>;
  touca::workflow("simple_workflow", simple_workflow);
  MainCaller caller;
  TmpFile outputDir;
  TmpFile configFile;
  configFile.write(
      R"({ "touca": { "api-url": "https://api.touca.io/@/some-team/some-suite" }, "custom-key": "custom-value" })");

  caller.call_with({"--offline", "--revision", "1.0", "--output-directory",
                    outputDir.path.string(), "--config-file",
                    configFile.path.string(), "--testcase", "4,8,15,16,23,42",
                    "--save-as-binary", "true", "--save-as-json", "true",
                    "--colored-output=false"});

  SECTION("first-run") {
    CHECK(caller.exit_code() == EXIT_SUCCESS);
    CHECK_THAT(caller.cout(), Catch::Contains("Suite: some-suite/1.0"));
    CHECK_THAT(caller.cout(), Catch::Contains("5.  PASS   23    (0 ms)"));
    CHECK_THAT(caller.cout(), Catch::Contains("6.  FAIL   42    (0 ms)"));
    CHECK_THAT(caller.cout(), Catch::Contains("- some-error"));
    CHECK_THAT(caller.cout(), Catch::Contains("5 passed, 1 failed, 6 total"));
    CHECK_THAT(caller.cout(), Catch::Contains("Ran all test suites."));
    CHECK(caller.cerr().empty());
  }

  SECTION("second-run-without-overwrite") {
    caller.call_with({"--offline", "--revision", "1.0", "--output-directory",
                      outputDir.path.string(), "--config-file",
                      configFile.path.string(), "--testcase", "4,8,15,16,23,42",
                      "--save-as-binary", "true", "--save-as-json", "true",
                      "--colored-output=false"});

    CHECK(caller.exit_code() == EXIT_SUCCESS);
    CHECK_THAT(caller.cout(), Catch::Contains("Suite: some-suite/1.0"));
    CHECK_THAT(caller.cout(), Catch::Contains("5.  SKIP   23"));
    CHECK_THAT(caller.cout(), Catch::Contains("6.  FAIL   42    (0 ms)"));
    CHECK_THAT(caller.cout(), Catch::Contains("- some-error"));
    CHECK_THAT(caller.cout(), Catch::Contains("5 skipped, 1 failed, 6 total"));
    CHECK_THAT(caller.cout(), Catch::Contains("Ran all test suites."));
    CHECK(caller.cerr().empty());
  }

  SECTION("second-run-with-overwrite") {
    caller.call_with({"--offline", "--revision", "1.0", "--output-directory",
                      outputDir.path.string(), "--config-file",
                      configFile.path.string(), "--testcase", "4,8,15,16,23,42",
                      "--save-as-json", "true", "--overwrite",
                      "--colored-output=false"});

    CHECK(caller.exit_code() == EXIT_SUCCESS);
    CHECK_THAT(caller.cout(), Catch::Contains("Suite: some-suite/1.0"));
    CHECK_THAT(caller.cout(), Catch::Contains("5.  PASS   23    (0 ms)"));
    CHECK_THAT(caller.cout(), Catch::Contains("6.  FAIL   42    (0 ms)"));
    CHECK_THAT(caller.cout(), Catch::Contains("- some-error"));
    CHECK_THAT(caller.cout(), Catch::Contains("5 passed, 1 failed, 6 total"));
    CHECK_THAT(caller.cout(), Catch::Contains("Ran all test suites."));
    CHECK(caller.cerr().empty());
  }

  SECTION("run-with-strange-names") {
    caller.call_with(
        {"--offline", "--revision", "1.0", "--output-directory",
         outputDir.path.string(), "--config-file", configFile.path.string(),
         "--testcase", R"(he%lOo,w{}rld,こんにちは,0,🙋🏽‍♀️)",
         "--save-as-json", "--overwrite", "--colored-output=false"});

    CHECK(caller.exit_code() == EXIT_SUCCESS);
    CHECK_THAT(caller.cout(), Catch::Contains("Suite: some-suite/1.0"));
    CHECK_THAT(caller.cout(),
               Catch::Contains(R"(1.  PASS   he%lOo               (0 ms)"));
    CHECK_THAT(caller.cout(),
               Catch::Contains(R"(2.  PASS   w{}rld               (0 ms)"));
    CHECK_THAT(caller.cout(),
               Catch::Contains(R"(3.  PASS   こんにちは           (0 ms))"));
    CHECK_THAT(caller.cout(),
               Catch::Contains(R"(4.  PASS   0                    (0 ms))"));
    CHECK_THAT(
        caller.cout(),
        Catch::Contains(R"(5.  PASS   🙋🏽‍♀️              (0 ms))"));
    CHECK_THAT(caller.cout(), Catch::Contains("5 passed, 5 total"));
    CHECK_THAT(caller.cout(), Catch::Contains("Ran all test suites."));
    CHECK(caller.cerr().empty());
  }

  SECTION("directory-structure") {
    fnames suiteFiles =
        ResultChecker(fnames({outputDir.path})).get_regular_files("some-suite");
    fnames suiteDirs =
        ResultChecker(fnames({outputDir.path})).get_directories("some-suite");
    CHECK(suiteFiles.empty());
    CHECK_THAT(suiteDirs, Catch::UnorderedEquals(fnames({"1.0"})));

    fnames revisionFiles = ResultChecker(fnames({outputDir.path, "some-suite"}))
                               .get_regular_files("1.0");
    fnames revisionDirs = ResultChecker(fnames({outputDir.path, "some-suite"}))
                              .get_directories("1.0");
    CHECK_THAT(revisionFiles,
               Catch::UnorderedEquals(fnames({"Console.log", "touca.log"})));
    CHECK_THAT(revisionDirs, Catch::UnorderedEquals(
                                 fnames({"42", "23", "16", "15", "8", "4"})));

    fnames caseFiles =
        ResultChecker(fnames({outputDir.path, "some-suite", "1.0"}))
            .get_regular_files("15");
    fnames caseDirs =
        ResultChecker(fnames({outputDir.path, "some-suite", "1.0"}))
            .get_directories("15");
    CHECK_THAT(caseFiles,
               Catch::UnorderedEquals(fnames({"touca.json", "touca.bin"})));
    CHECK_THAT(caseDirs, Catch::UnorderedEquals(fnames({})));
  }

  SECTION("directory-content-streams") {
    fnames caseFiles =
        ResultChecker(fnames({outputDir.path, "some-suite", "1.0"}))
            .get_regular_files("8");
    REQUIRE_THAT(caseFiles,
                 Catch::UnorderedEquals(fnames(
                     {"stdout.txt", "stderr.txt", "touca.json", "touca.bin"})));
    touca::filesystem::path caseDir = outputDir.path;
    caseDir = caseDir / "some-suite" / "1.0" / "8";
    const auto& fileOut =
        touca::detail::load_text_file((caseDir / "stdout.txt").string());
    CHECK(fileOut == "simple message in output stream\n");
    const auto& fileErr =
        touca::detail::load_text_file((caseDir / "stderr.txt").string());
    CHECK(fileErr == "simple message in error stream\n");
  }

  SECTION("directory-content-json") {
    fnames caseFiles =
        ResultChecker(fnames({outputDir.path, "some-suite", "1.0"}))
            .get_regular_files("4");
    REQUIRE_THAT(caseFiles,
                 Catch::UnorderedEquals(fnames({"touca.json", "touca.bin"})));
    touca::filesystem::path caseDir = outputDir.path;
    caseDir = caseDir / "some-suite" / "1.0" / "4";
    const auto& fileJson =
        touca::detail::load_text_file((caseDir / "touca.json").string());
    CHECK_THAT(
        fileJson,
        Catch::Contains(
            R"("teamslug":"some-team","testsuite":"some-suite","version":"1.0","testcase":"4")"));
    CHECK_THAT(fileJson,
               Catch::Contains(R"({"key":"some-number","value":"1024"})"));
    CHECK_THAT(fileJson,
               Catch::Contains(R"({"key":"some-string","value":"foo"})"));
    CHECK_THAT(fileJson, Catch::Contains(R"("assertion":[])"));
    CHECK_THAT(fileJson, Catch::Contains(R"("metrics":[])"));
  }
  touca::detail::reset_test_runner();
}

TEST_CASE("runner-redirect-output-disabled") {
  using fnames = std::vector<touca::filesystem::path>;
  touca::workflow("simple_workflow", simple_workflow);
  MainCaller caller;
  TmpFile outputDir;
  TmpFile configFile;
  configFile.write(
      R"({ "touca": { "api-url": "https://api.touca.io/@/some-team/some-suite" }, "workflow": { "custom-key": "custom-value" } })");

  caller.call_with({"--offline", "--revision", "1.0", "--output-directory",
                    outputDir.path.string(), "--config-file",
                    configFile.path.string(), "--testcase", "4,8,15,16,23,42",
                    "--redirect-output=false"});

  SECTION("directory-content-streams") {
    fnames caseFiles =
        ResultChecker(fnames({outputDir.path, "some-suite", "1.0"}))
            .get_regular_files("8");
    REQUIRE_THAT(caseFiles, Catch::UnorderedEquals(fnames()));
  }
  touca::detail::reset_test_runner();
}
