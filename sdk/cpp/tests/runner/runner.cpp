// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/runner/runner.hpp"

#include <iostream>

#include "catch2/catch.hpp"
#include "tests/devkit/tmpfile.hpp"
#include "touca/core/config.hpp"
#include "touca/devkit/utils.hpp"
#include "touca/runner/detail/ostream.hpp"
#include "touca/touca.hpp"

struct DummySuite final : public touca::Suite {};

struct SimpleSuite final : public touca::Suite {
  using Inputs = std::vector<std::string>;
  SimpleSuite(const Inputs& inputs) : Suite(), _inputs(inputs) {}
  void initialize() {
    std::for_each(_inputs.begin(), _inputs.end(),
                  [this](const Inputs::value_type& i) { push(i); });
  }
  Inputs _inputs;
};

struct DummyWorkflow : public touca::Workflow {
  std::shared_ptr<touca::Suite> suite() const override {
    return std::make_shared<DummySuite>();
  }
  touca::Errors execute(const std::string& testcase) const override {
    std::ignore = testcase;
    return {};
  }
  bool skip(const std::string& testcase) const override {
    return testcase == "case-to-exclude";
  }
  std::string describe_options() const override {
    return "Workflow specific help message";
  }
};

struct SimpleWorkflow : public touca::Workflow {
  SimpleWorkflow() : Workflow() {}
  std::shared_ptr<touca::Suite> suite() const override {
    SimpleSuite::Inputs inputs = {"4", "8", "15", "16", "23", "42"};
    return std::make_shared<SimpleSuite>(inputs);
  }
  touca::Errors execute(const std::string& testcase) const override {
    if (testcase == "8") {
      std::cout << "simple message in output stream" << std::endl;
      std::cerr << "simple message in error stream" << std::endl;
    }
    if (testcase == "42") {
      return {"some-error"};
    }
    if (testcase == "4") {
      touca::check("some-number", 1024);
      touca::check("some-string", "foo");
      touca::add_array_element("some-array", "bar");
    }
    return {};
  }
};

template <class Workflow>
class MainCaller {
 public:
  void call_with(const std::vector<std::string>& args) {
    std::vector<char*> argv;
    argv.push_back((char*)"myapp");
    for (const auto& arg : args) {
      argv.push_back((char*)arg.data());
    }
    argv.push_back(nullptr);

    capturer.start_capture();
    exit_status = touca::main(argv.size() - 1, argv.data(), workflow);
    capturer.stop_capture();
  }

  inline int exit_code() const { return exit_status; }
  inline std::string cerr() const { return capturer.cerr(); }
  inline std::string cout() const { return capturer.cout(); }

 private:
  int exit_status = 0;
  Workflow workflow;
  OutputCapturer capturer;
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

TEST_CASE("suite") {
  SECTION("dummy suite") {
    DummySuite suite;
    CHECK(suite.size() == 0);
    suite.initialize();
    CHECK(suite.size() == 0);
  }

  SECTION("simple suite") {
    SimpleSuite::Inputs inputs = {"4", "8", "15", "16", "23", "42"};
    SimpleSuite suite(inputs);
    CHECK(suite.size() == 0);
    suite.initialize();
    CHECK(suite.size() == 6);
    CHECK(std::equal(suite.begin(), suite.end(), inputs.begin()));
  }
}

TEST_CASE("workflow") {
  SECTION("dummy workflow") {
    DummyWorkflow workflow;
    CHECK(workflow.suite());
    CHECK(workflow.suite()->size() == 0);
    CHECK(workflow.describe_options() == "Workflow specific help message");
    CHECK(workflow.validate_options());
    CHECK(workflow.initialize());
    CHECK(!workflow.skip("1"));
    CHECK(workflow.skip("case-to-exclude"));
    CHECK(!workflow.log_subscriber());
  }

  SECTION("simple workflow") {
    CHECK(SimpleWorkflow().describe_options().empty());
  }
}

TEST_CASE("framework-dummy-workflow") {
  MainCaller<DummyWorkflow> caller;
  TmpFile tmpFile;

  SECTION("help") {
    caller.call_with({"--help"});
    CHECK(caller.exit_code() == EXIT_SUCCESS);
    CHECK_THAT(caller.cout(), Catch::Contains("Command Line Options"));
    CHECK_THAT(caller.cout(),
               Catch::Contains("Workflow specific help message"));
    CHECK(caller.cerr().empty());
  }

  SECTION("version") {
    caller.call_with({"--version"});
    const auto expected =
        touca::detail::format("{}.{}.{}\n", TOUCA_VERSION_MAJOR,
                              TOUCA_VERSION_MINOR, TOUCA_VERSION_PATCH);
    CHECK(caller.exit_code() == EXIT_SUCCESS);
    CHECK(caller.cout() == expected);
    CHECK(caller.cerr().empty());
  }

  SECTION("noarg") {
    caller.call_with({});
    CHECK(caller.exit_code() == EXIT_FAILURE);
    CHECK(caller.cout().empty());
    CHECK_THAT(caller.cerr(),
               Catch::Contains("expected configuration options"));
    CHECK_THAT(caller.cerr(), Catch::Contains(" - revision"));
    CHECK_THAT(caller.cerr(), Catch::Contains(" - suite"));
    CHECK_THAT(caller.cerr(), Catch::Contains(" - team"));
  }

  SECTION("offline") {
    caller.call_with({"--offline", "-r", "1.0", "-o", tmpFile.path.string(),
                      "--team", "some-team", "--suite", "some-suite"});
    CHECK(caller.exit_code() == EXIT_FAILURE);
    CHECK_THAT(caller.cout(), Catch::Contains("Touca Test Framework"));
    CHECK_THAT(caller.cout(), Catch::Contains("Suite: some-suite/1.0"));
    CHECK_THAT(
        caller.cout(),
        Catch::Contains("unable to proceed with empty list of testcases"));
    CHECK(caller.cerr().empty());
  }

  SECTION("single-testcase") {
    caller.call_with({"--offline", "-r", "1.0", "-o", tmpFile.path.string(),
                      "--team", "some-team", "--suite", "some-suite",
                      "--testcase", "some-case", "--save-as-binary", "false",
                      "--colored-output=false"});
    CHECK(caller.exit_code() == EXIT_SUCCESS);
    CHECK_THAT(caller.cout(),
               Catch::Contains("1.  PASS   some-case    (0 ms)"));
    CHECK_THAT(caller.cout(), Catch::Contains("1 passed, 1 total"));
    CHECK_THAT(caller.cout(), Catch::Contains("Ran all test suites."));
    CHECK(caller.cerr().empty());
  }

  SECTION("api-url") {
    caller.call_with(
        {"--offline", "-r", "1.0", "-o", tmpFile.path.string(), "--api-url",
         "http://localhost/api/@/some-team/some-suite", "--testcase",
         "some-case", "--save-as-binary", "false", "--colored-output=false"});
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
    caller.call_with({"--offline", "-r", "1.0", "-o", tmpFile.path.string(),
                      "--config-file", configFile.path.string()});
    CHECK(caller.exit_code() == EXIT_FAILURE);
    CHECK(caller.cout().empty());
    CHECK_THAT(
        caller.cerr(),
        Catch::Contains("expected configuration file to be a json object"));
    CHECK_THAT(caller.cerr(), Catch::Contains("Command Line Options"));
  }

  SECTION("valid-config-file") {
    TmpFile configFile;
    configFile.write(
        R"({ "framework": { "save-as-binary": false, "save-as-json": false, "skip-logs": true, "log-level": "error", "overwrite": false }, "touca": { "api-key": "03dda763-62ea-436f-8395-f45296e56e4b", "api-url": "https://api.touca.io/@/some-team/some-suite" }, "custom-key": "custom-value" })");
    caller.call_with({"--offline", "-r", "1.0", "-o", tmpFile.path.string(),
                      "--config-file", configFile.path.string(), "--testcase",
                      "some-case", "--colored-output=false"});
    CHECK(caller.exit_code() == EXIT_SUCCESS);
    CHECK_THAT(caller.cout(), Catch::Contains("Suite: some-suite/1.0"));
    CHECK_THAT(caller.cout(),
               Catch::Contains("1.  PASS   some-case    (0 ms)"));
    CHECK_THAT(caller.cout(), Catch::Contains("1 passed, 1 total"));
    CHECK_THAT(caller.cout(), Catch::Contains("Ran all test suites."));
    CHECK(caller.cerr().empty());
  }
}

TEST_CASE("framework-simple-workflow-valid-use") {
  using fnames = std::vector<touca::filesystem::path>;

  MainCaller<SimpleWorkflow> caller;
  TmpFile outputDir;
  TmpFile configFile;
  configFile.write(
      R"({ "touca": { "api-url": "https://api.touca.io/@/some-team/some-suite" }, "custom-key": "custom-value" })");

  caller.call_with({"--offline", "-r", "1.0", "-o", outputDir.path.string(),
                    "--config-file", configFile.path.string(), "--save-as-json",
                    "true", "--colored-output=false"});

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
    caller.call_with({"--offline", "-r", "1.0", "-o", outputDir.path.string(),
                      "--config-file", configFile.path.string(),
                      "--save-as-json", "true", "--colored-output=false"});

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
    caller.call_with({"--offline", "-r", "1.0", "-o", outputDir.path.string(),
                      "--config-file", configFile.path.string(),
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
        touca::detail::load_string_file((caseDir / "stdout.txt").string());
    CHECK(fileOut == "simple message in output stream\n");
    const auto& fileErr =
        touca::detail::load_string_file((caseDir / "stderr.txt").string());
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
        touca::detail::load_string_file((caseDir / "touca.json").string());
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
}

TEST_CASE("framework-redirect-output-disabled") {
  using fnames = std::vector<touca::filesystem::path>;

  MainCaller<SimpleWorkflow> caller;
  TmpFile outputDir;
  TmpFile configFile;
  configFile.write(
      R"({ "touca": { "api-url": "https://api.touca.io/@/some-team/some-suite" }, "workflow": { "custom-key": "custom-value" } })");

  caller.call_with({"--offline", "-r", "1.0", "-o", outputDir.path.string(),
                    "--config-file", configFile.path.string(),
                    "--redirect-output=false"});

  SECTION("directory-content-streams") {
    fnames caseFiles =
        ResultChecker(fnames({outputDir.path, "some-suite", "1.0"}))
            .get_regular_files("8");
    REQUIRE_THAT(caseFiles, Catch::UnorderedEquals(fnames({"touca.bin"})));
  }
}
