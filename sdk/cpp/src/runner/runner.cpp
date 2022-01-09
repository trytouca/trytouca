// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/runner/runner.hpp"

#include <fstream>
#include <iostream>
#include <memory>
#include <string>
#include <thread>
#include <unordered_map>

#include "cxxopts.hpp"
#include "fmt/color.h"
#include "fmt/ostream.h"
#include "fmt/printf.h"
#include "nlohmann/json.hpp"
#include "touca/core/config.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/devkit/platform.hpp"
#include "touca/devkit/utils.hpp"
#include "touca/runner/detail/ostream.hpp"
#include "touca/runner/runner.hpp"
#include "touca/touca.hpp"

#ifdef _WIN32
#undef GetObject
#endif

namespace touca {

struct DummySuite final : public touca::Suite {
  DummySuite(const std::vector<std::string>& testcases) {
    for (const auto& testcase : testcases) {
      push(testcase);
    }
  }
};

struct {
  std::vector<std::pair<std::unique_ptr<Sink>, Sink::Level>> sinks;
  std::map<std::string, std::function<void(const std::string&)>> workflows;
} _meta;

void workflow(const std::string& name,
              const std::function<void(const std::string&)> func) {
  _meta.workflows.emplace(name, func);
}

void add_sink(std::unique_ptr<Sink> sink, const Sink::Level level) {
  _meta.sinks.push_back(std::make_pair(std::move(sink), level));
}

int run(int argc, char* argv[]) {
  bool status = true;
  for (auto& func : _meta.workflows) {
    struct Runner : public touca::Workflow {
     public:
      Runner(const std::function<void(const std::string&)> workflow)
          : _workflow(workflow){};
      std::shared_ptr<touca::Suite> suite() const override {
        return std::make_shared<DummySuite>(
            touca::get_testsuite_remote(_options));
      }
      std::vector<std::string> execute(
          const std::string& testcase) const override {
        _workflow(testcase);
        return {};
      }

     private:
      std::function<void(const std::string&)> _workflow;
    } runner(func.second);
    status &= main(argc, argv, runner);
  }
  return status;
}

bool Workflow::parse_options(int argc, char* argv[]) {
  std::ignore = argc;
  std::ignore = argv;
  return true;
}

bool Workflow::skip(const std::string& testcase) const {
  touca::filesystem::path outputDirCase = _options.output_dir;
  outputDirCase /= _options.suite;
  outputDirCase /= _options.revision;
  outputDirCase /= testcase;
  if (_options.save_binary) {
    outputDirCase /= "touca.bin";
  } else if (_options.save_json) {
    outputDirCase /= "touca.json";
  } else {
    return false;
  }
  return touca::filesystem::exists(outputDirCase.string());
}

void Workflow::set_options(const FrameworkOptions& options) {
  _options = options;
}

void Suite::push(const std::string& testcase) {
  if (!_set.count(testcase)) {
    _set.insert(testcase);
    _vec.push_back(testcase);
  }
}

cxxopts::Options cli_options() {
  cxxopts::Options options("./app", "Command Line Options");

  // clang-format off
  options.add_options("main")
      ("h,help", "displays this help message")
      ("v,version", "prints version of this executable")
      ("c,config-file",
          "path to configuration file",
          cxxopts::value<std::string>())
      ("api-key",
          "Touca server api key",
          cxxopts::value<std::string>())
      ("api-url",
          "Touca server api url",
          cxxopts::value<std::string>())
      ("team",
          "slug of team to which testresults belong",
          cxxopts::value<std::string>())
      ("suite",
          "slug of suite to which testresults belong",
          cxxopts::value<std::string>())
      ("r,revision",
          "version to associate with testresults",
          cxxopts::value<std::string>())
      ("testcase",
          "one or more testcases to feed to the workflow",
          cxxopts::value<std::vector<std::string>>())
      ("testcase-file",
          "single file listing testcases to feed to the workflow",
          cxxopts::value<std::string>())
      ("o,output-dir",
          "path to output directory",
          cxxopts::value<std::string>()->default_value("./results"))
      ("log-level",
          "level of detail with which events are logged",
          cxxopts::value<std::string>()->default_value("info"))
      ("save-as-binary",
          "save a copy of test results on local disk in binary format",
          cxxopts::value<bool>()->implicit_value("true")->default_value("true"))
      ("save-as-json",
          "save a copy of test results on local disk in json format",
          cxxopts::value<bool>()->implicit_value("true")->default_value("false"))
      ("skip-logs",
          "do not generate log files",
          cxxopts::value<bool>()->implicit_value("true"))
      ("redirect-output",
          "redirect content printed to standard streams to files",
          cxxopts::value<bool>()->default_value("true"))
      ("offline",
          "do not submit results to Touca server",
          cxxopts::value<bool>()->implicit_value("true"))
      ("overwrite",
          "overwrite result directory for testcase if it already exists",
          cxxopts::value<bool>()->implicit_value("true"))
      ("colored-output",
          "colored output",
          cxxopts::value<bool>()->default_value("true"));
  // clang-format on

  return options;
}

template <typename T>
void parse_cli_option(const cxxopts::ParseResult& result,
                      const std::string& key, T& field) {
  if (result[key].count()) {
    field = result[key].as<T>();
  }
}

template <typename T>
void parse_file_option(const nlohmann::json& result, const std::string& key,
                       T& field) {
  if (result.contains(key)) {
    field = result[key];
  }
}

/**
 * @param argc number of arguments provided to the application
 * @param argv list of arguments provided to the application
 * @param options application configuration parameters
 */
bool parse_cli_options(int argc, char* argv[], FrameworkOptions& options) {
  auto opts = cli_options();
  opts.allow_unrecognised_options();
  try {
    const auto& result = opts.parse(argc, argv);
    if (result.count("help")) {
      options.has_help = true;
    }
    if (result.count("version")) {
      options.has_version = true;
    }
    if (result.count("testcase")) {
      options.testcases = result["testcase"].as<std::vector<std::string>>();
    }
    options.output_dir = result["output-dir"].as<std::string>();
    options.log_level = result["log-level"].as<std::string>();
    options.save_binary = result["save-as-binary"].as<bool>();
    options.save_json = result["save-as-json"].as<bool>();
    options.redirect = result["redirect-output"].as<bool>();
    options.colored_output = result["colored-output"].as<bool>();
    parse_cli_option(result, "api-key", options.api_key);
    parse_cli_option(result, "api-url", options.api_url);
    parse_cli_option(result, "config-file", options.config_file);
    parse_cli_option(result, "testcase-file", options.testcase_file);
    parse_cli_option(result, "team", options.team);
    parse_cli_option(result, "suite", options.suite);
    parse_cli_option(result, "revision", options.revision);
    parse_cli_option(result, "skip-logs", options.skip_logs);
    parse_cli_option(result, "offline", options.offline);
    parse_cli_option(result, "overwrite", options.overwrite);
  } catch (const cxxopts::OptionParseException& ex) {
    touca::print_error("failed to parse command line arguments: {}\n",
                       ex.what());
    return false;
  }

  return true;
}

bool parse_file_options(FrameworkOptions& options) {
  // if user is asking for help description or framework version,
  // do not parse the configuration file even if it is specified.

  if (options.has_help || options.has_version) {
    return true;
  }

  // if configuration file is not specified yet a file config.json
  // exists in current directory, attempt to use that file.

  if (options.config_file.empty()) {
    if (!touca::filesystem::is_regular_file("./config.json")) {
      return true;
    }
    options.config_file = "./config.json";
  }

  // configuration file must exist if it is specified

  if (!touca::filesystem::is_regular_file(options.config_file)) {
    touca::print_error("configuration file not found: {}\n",
                       options.config_file);
    return false;
  }

  // load configuration file in memory

  const auto& content = touca::detail::load_string_file(options.config_file);

  // parse configuration file

  const auto& parsed = nlohmann::json::parse(content, nullptr, false);
  if (parsed.is_discarded()) {
    touca::print_error("failed to parse configuration file\n");
    return false;
  }

  // we expect content to be a json object

  if (!parsed.is_object()) {
    touca::print_error("expected configuration file to be a json object\n");
    return false;
  }

  for (const auto& kvp : parsed.items()) {
    const auto& result = kvp.value();
    if (kvp.key() == "touca") {
      if (!result.is_object()) {
        touca::print_error(
            "field \"touca\" in configuration file has unexpected type\n");
        return false;
      }
      parse_file_option(result, "api-key", options.api_key);
      parse_file_option(result, "api-url", options.api_url);
      parse_file_option(result, "team", options.team);
      parse_file_option(result, "suite", options.suite);
      parse_file_option(result, "revision", options.revision);
      parse_file_option(result, "config-file", options.config_file);
      parse_file_option(result, "output-dir", options.output_dir);
      parse_file_option(result, "log-level", options.log_level);
      parse_file_option(result, "save-as-binary", options.save_binary);
      parse_file_option(result, "save-as-json", options.save_json);
      parse_file_option(result, "single-thread", options.single_thread);
      parse_file_option(result, "skip-logs", options.skip_logs);
      parse_file_option(result, "redirect-output", options.redirect);
      parse_file_option(result, "offline", options.offline);
      parse_file_option(result, "overwrite", options.overwrite);
      parse_file_option(result, "testcase-file", options.testcase_file);
    } else {
      if (result.is_string()) {
        options.extra.emplace(kvp.key(), result.get<std::string>());
      } else if (result.is_boolean()) {
        options.extra.emplace(kvp.key(), result.get<bool>() ? "true" : "false");
      }
    }
  }

  return true;
}

bool parse_env_variables(FrameworkOptions& options) {
  const std::unordered_map<std::string, std::string&> env_table = {
      {"TOUCA_API_KEY", options.api_key},
      {"TOUCA_API_URL", options.api_url},
      {"TOUCA_TEST_VERSION", options.revision},
  };
  for (const auto& kvp : env_table) {
    const auto env_value = std::getenv(kvp.first.c_str());
    if (env_value != nullptr) {
      kvp.second = env_value;
    }
  }
  return true;
}

bool parse_api_url(FrameworkOptions& options) {
  // it is okay if configuration option `--api-url` is not specified
  if (options.api_url.empty()) {
    return true;
  }
  touca::ApiUrl api(options.api_url);
  if (options.team.empty() && !api._team.empty()) {
    options.team = api._team;
  }
  if (options.suite.empty() && !api._suite.empty()) {
    options.suite = api._suite;
  }
  if (options.revision.empty() && !api._revision.empty()) {
    options.revision = api._revision;
  }
  return true;
}

bool parse_options(int argc, char* argv[], FrameworkOptions& options) {
  auto ret = true;
  ret &= parse_cli_options(argc, argv, options);
  ret &= parse_file_options(options);
  ret &= parse_env_variables(options);
  ret &= parse_api_url(options);
  return ret;
}

bool expect_options(const std::map<std::string, std::string>& options) {
  const auto& is_missing = [](const std::pair<std::string, std::string>& kvp) {
    return kvp.second.empty();
  };
  if (!std::any_of(options.begin(), options.end(), is_missing)) {
    return true;
  }
  fmt::print(std::cerr, "expected configuration options:\n");
  for (const auto& kvp : options) {
    if (kvp.second.empty()) {
      fmt::print(std::cerr, " - {}\n", kvp.first);
    }
  }
  return false;
}

bool validate_api_url(const FrameworkOptions& options) {
  touca::ApiUrl api(options.api_url);
  if (!api.confirm(options.team, options.suite, options.revision)) {
    fmt::print(std::cerr, "{}\n", api._error);
    return false;
  }
  return true;
}

bool validate_options(const FrameworkOptions& options) {
  // we always expect a value for the following options.
  if (!expect_options({{"team", options.team},
                       {"suite", options.suite},
                       {"revision", options.revision},
                       {"output-dir", options.output_dir}})) {
    return false;
  }

  // expect `api-url` unless `offline` is specified.
  if (!options.offline && !expect_options({{"api-url", options.api_url}})) {
    return false;
  }

  // options `api-url`, `suite`, `revision` and `team` must be consistent.
  if (!options.api_url.empty() && !validate_api_url(options)) {
    return false;
  }

  // expect `log-level` to be one of `debug`, `info`, or `warning`.
  const auto& level = options.log_level;
  const auto& levels = {"debug", "info", "warning"};
  const auto isValid =
      std::find(levels.begin(), levels.end(), level) != levels.end();
  if (!isValid) {
    touca::print_error(
        "value of option \"--log-level\" must be one of \"debug\", \"info\" "
        "or \"warning\".\n");
    return false;
  }

  return true;
}

struct Logger {
  void debug(const std::string& msg) const { publish(Sink::Level::Debug, msg); }
  void info(const std::string& msg) const { publish(Sink::Level::Info, msg); }
  void warn(const std::string& msg) const { publish(Sink::Level::Warn, msg); }
  void error(const std::string& msg) const { publish(Sink::Level::Error, msg); }

  void add(std::unique_ptr<Sink> sink, const Sink::Level level) {
    _sinks.push_back(std::make_pair(std::move(sink), level));
  }

 private:
  void publish(const Sink::Level level, const std::string& msg) const {
    for (const auto& kvp : _sinks) {
      if (kvp.second <= level) {
        kvp.first->log(level, msg);
      }
    }
  }

  std::vector<std::pair<std::unique_ptr<Sink>, Sink::Level>> _sinks;
};

std::string stringify(const Sink::Level& log_level) {
  static const std::map<Sink::Level, std::string> names = {
      {Sink::Level::Debug, "debug"},
      {Sink::Level::Info, "info"},
      {Sink::Level::Warn, "warning"},
      {Sink::Level::Error, "error"},
  };
  return names.at(log_level);
}

struct ConsoleSink : public Sink {
  void log(const Sink::Level level, const std::string& msg) override {
    fmt::print(std::cout, "{0:<8}{1:}\n", stringify(level), msg);
  }
};

struct FileSink : public Sink {
  FileSink(const touca::filesystem::path& logDir) : Sink() {
    const auto logFilePath = logDir / "touca.log";
    _ofs = std::ofstream(logFilePath.string(), std::ios::trunc);
  }

  ~FileSink() { _ofs.close(); }

  void log(const Sink::Level level, const std::string& msg) override {
    char timestamp[32];
    std::time_t point_t = std::time(nullptr);
    std::strftime(timestamp, sizeof(timestamp), "%FT%TZ",
                  std::gmtime(&point_t));

    std::stringstream threadstamp;
    threadstamp << std::this_thread::get_id();

    _ofs << fmt::format("{} {} {:<8} {}\n", timestamp, threadstamp.str(),
                        stringify(level), msg);
  }

 private:
  std::ofstream _ofs;
};

Sink::Level find_log_level(const std::string& name) {
  static const std::unordered_map<std::string, Sink::Level> values = {
      {"debug", Sink::Level::Debug},
      {"info", Sink::Level::Info},
      {"warning", Sink::Level::Warn},
      {"error", Sink::Level::Error}};
  return values.at(name);
}

struct SingleCaseSuite final : public Suite {
  SingleCaseSuite(const std::string& testcase) { push(testcase); }
  SingleCaseSuite(const std::vector<std::string>& cases) {
    for (const auto& tc : cases) {
      push(tc);
    }
  }
};

enum Status : uint8_t { Pass, Fail, Skip };

class Statistics {
  std::map<Status, unsigned long> _v;

 public:
  void inc(Status value) {
    if (!_v.count(value)) {
      _v[value] = 0u;
    }
    _v[value] += 1u;
  }
  unsigned long count(Status value) const {
    return _v.count(value) ? _v.at(value) : 0u;
  }
};

class Timer {
  std::unordered_map<std::string, std::chrono::system_clock::time_point> _tics;
  std::unordered_map<std::string, std::chrono::system_clock::time_point> _tocs;

 public:
  void tic(const std::string& key) {
    _tics[key] = std::chrono::system_clock::now();
  }
  void toc(const std::string& key) {
    _tocs[key] = std::chrono::system_clock::now();
  }
  bool contains(const std::string& key) const {
    return _tocs.count(key) && _tics.count(key);
  }
  long long count(const std::string& key) const {
    const auto& dur = _tocs.at(key) - _tics.at(key);
    return std::chrono::duration_cast<std::chrono::milliseconds>(dur).count();
  }
};

struct Printer {
  void update(const touca::filesystem::path& path, const bool colored_output) {
    _color = colored_output;
    _file = std::ofstream(path.string(), std::ios::trunc);
  }

  void print_header(const FrameworkOptions& options) {
    print("\nTouca Test Framework\nSuite: {}/{}\n\n", options.suite,
          options.revision);
  }

  void print_progress(const std::string& testcase, const unsigned index,
                      const unsigned testcase_width, const Timer& timer,
                      const std::vector<std::string>& errors) {
    const auto status = timer.contains(testcase)
                            ? errors.empty() ? Status::Pass : Status::Fail
                            : Status::Skip;
    print(" {}", index);
    print(fmt::fg(fmt::terminal_color::bright_black), ". ");
    print(fmt::bg(std::get<1>(_states.at(status))) |
              fmt::fg(fmt::terminal_color::bright_white),
          " {} ", std::get<0>(_states.at(status)));
    print("  {:<{}} ", testcase, testcase_width + 3);
    if (timer.contains(testcase)) {
      print(fmt::fg(fmt::terminal_color::bright_black), "({:d} ms)",
            timer.count(testcase));
    }
    print("\n");
    if (errors.empty()) {
      return;
    }
    print(fmt::fg(fmt::terminal_color::bright_black),
          "\n   Exception Raised:\n");
    for (const auto& err : errors) {
      print("      - {}\n", err);
    }
    print("\n");
  }

  void print_footer(const Statistics& stats, Timer& timer,
                    const unsigned suiteSize) {
    const auto duration = timer.count("__workflow__") / 1000.0;
    const auto report = [&](const Status status,
                            const fmt::terminal_color color,
                            const std::string& name) {
      if (stats.count(status)) {
        print(fmt::fg(color), "{} {}, ", stats.count(status), name);
      }
    };
    print("\nTests:      ");
    report(Status::Pass, fmt::terminal_color::green, "passed");
    report(Status::Skip, fmt::terminal_color::yellow, "skipped");
    report(Status::Fail, fmt::terminal_color::red, "failed");
    print("{} total\n", suiteSize);
    print("Time:       {:.2f} s\n", duration);
    print("\n✨   Ran all test suites.\n\n");
  }

 private:
  template <typename... Args>
  void print(const std::string& fmtstr, Args&&... args) {
    const auto& content = fmt::format(fmtstr, std::forward<Args>(args)...);
    fmt::print(_file, content);
    fmt::print(std::cout, content);
    _file.flush();
    std::cout.flush();
  }

  template <typename... Args>
  void print(const fmt::text_style& style, const std::string& fmtstr,
             Args&&... args) {
    const auto& content = fmt::format(fmtstr, std::forward<Args>(args)...);
    fmt::print(_file, content);
    fmt::print(std::cout, _color ? fmt::format(style, content) : content);
    _file.flush();
    std::cout.flush();
  }

  bool _color;
  std::ofstream _file;
  const std::unordered_map<Status, std::tuple<std::string, fmt::terminal_color>>
      _states = {
          {Status::Pass, std::make_tuple("PASS", fmt::terminal_color::green)},
          {Status::Skip, std::make_tuple("SKIP", fmt::terminal_color::yellow)},
          {Status::Fail, std::make_tuple("FAIL", fmt::terminal_color::red)}};
};

struct Runner {
  Runner() = default;
  int run_workflow(int argc, char* argv[], Workflow& workflow);

  void run_testcase(const Workflow& workflow, const std::string& testcase,
                    const unsigned index);

 private:
  Timer timer;
  Logger logger;
  Printer printer;
  Statistics stats;
  unsigned testcase_width;  // longest testcase length
  FrameworkOptions options;
};

int Runner::run_workflow(int argc, char* argv[], Workflow& workflow) {
  // parse configuration options provided as command line arguments
  // or specified in the configuration file.
  if (!parse_options(argc, argv, options)) {
    fmt::print(std::cerr, "{}\n", cli_options().help());
    return EXIT_FAILURE;
  }

  // if user asks for help, print help message and exit
  if (options.has_help) {
    fmt::print(std::cout, "{}\n", cli_options().help());
    const auto& desc = workflow.describe_options();
    if (!desc.empty()) {
      fmt::print(std::cout, "Workflow Options:\n{}\n", desc);
    }
    return EXIT_SUCCESS;
  }

  // if user asks for version, print version of this executable and exit
  if (options.has_version) {
    fmt::print(std::cout, "{}.{}.{}\n", TOUCA_VERSION_MAJOR,
               TOUCA_VERSION_MINOR, TOUCA_VERSION_PATCH);
    return EXIT_SUCCESS;
  }

  // validate all configuration options
  if (!validate_options(options)) {
    touca::print_error("failed to validate configuration options.\n");
    return EXIT_FAILURE;
  }

  // always print warning and errors log events to console
  logger.add(touca::detail::make_unique<ConsoleSink>(), Sink::Level::Warn);

  // establish output directory for this revision

  touca::filesystem::path outputDirRevision = options.output_dir;
  outputDirRevision /= options.suite;
  outputDirRevision /= options.revision;
  touca::filesystem::create_directories(outputDirRevision);

  // unless explicitly instructed not to do so, register a separate
  // file logger to write our events to a file in the output directory.
  if (!options.skip_logs) {
    logger.add(touca::detail::make_unique<FileSink>(outputDirRevision),
               find_log_level(options.log_level));
    logger.debug("registered cpp framework file logger");
  }

  // propagate parsed options to the workflow class
  workflow.set_options(options);

  // parse extra workflow-specific options, if any
  if (!workflow.parse_options(argc, argv)) {
    logger.error("failed to parse workflow-specific options");
    fmt::print(std::cout, "Workflow Options:\n{}\n",
               workflow.describe_options());
    return EXIT_FAILURE;
  }

  // log all parsed configuration options to help users debug their
  // workflow if validation fails. It is risky and less meaningful to
  // perform this operation any sooner.
  for (const auto& opt : options.extra) {
    logger.debug(fmt::format("{0:<16}: {1}", opt.first, opt.second));
  }

  // parse and validate extra workflow-specific options, using custom
  // logic provided by workflow author.
  if (!workflow.validate_options()) {
    logger.error("failed to validate workflow-specific options");
    return EXIT_FAILURE;
  }

  // if workflow provides a separate logger, register it to consume
  // our events.
  auto workflowLogger = workflow.log_subscriber();
  if (workflowLogger) {
    const auto& level = find_log_level(options.log_level);
    logger.add(std::move(workflowLogger), level);
    logger.debug("registered workflow logger");
  }

  // allow workflow authors to initialize their resources, if any,
  // such as external loggers or run tasks that need to be done
  // prior to execution of testcases.
  if (!workflow.initialize()) {
    logger.error("failed to initialize workflow");
    return EXIT_FAILURE;
  }
  logger.debug("initialized workflow");

  // Create a stream that simultaneously writes certain output
  // information printed on console to a file `Console.log` in
  // output directory for this revision.

  printer.update(outputDirRevision / "Console.log", options.colored_output);

  // Provide feedback to user that regression test is starting.
  // We perform this operation prior to configuring Touca client,
  // which may take a noticeable time.
  printer.print_header(options);

  touca::configure(options);

  // check that the client is properly configured
  if (!touca::is_configured()) {
    logger.error(fmt::format("failed to configure touca client: {}",
                             touca::configuration_error()));
    return EXIT_FAILURE;
  }
  logger.info("configured touca client");

  // initialize suite if workflow is providing one.
  auto suite = workflow.suite();
  if (suite) {
    try {
      suite->initialize();
      logger.debug("initialized suite");
    } catch (const std::exception& ex) {
      logger.error(
          fmt::format("failed to initialize workflow suite: {}", ex.what()));
      return EXIT_FAILURE;
    }
  }

  // if test is run for single testcase, overwrite suite with our own.
  if (!options.testcases.empty()) {
    suite = std::make_shared<SingleCaseSuite>(options.testcases);
  } else if (!options.testcase_file.empty()) {
    suite = std::make_shared<DummySuite>(
        touca::get_testsuite_local(options.testcase_file));
    suite->initialize();
  }

  // if workflow does not provide a suite, we choose not to proceed
  if (!suite) {
    logger.error("workflow does not provide a suite");
    return EXIT_FAILURE;
  }

  // validate suite
  if (suite->size() == 0) {
    logger.error("unable to proceed with empty list of testcases");
    return EXIT_FAILURE;
  }

  testcase_width =
      std::accumulate((*suite).begin(), (*suite).end(), 0ul,
                      [](const size_t sum, const std::string& testcase) {
                        return std::max(sum, testcase.length());
                      });

  // iterate over testcases and execute the workflow for each testcase.
  timer.tic("__workflow__");
  auto index = 0u;
  for (const auto& testcase : *suite) {
    ++index;
    run_testcase(workflow, testcase, index);
  }
  timer.toc("__workflow__");

  // write test execution statistics as footer to the user report
  printer.print_footer(stats, timer, suite->size());

  // seal this version if configured to do so.
  if (!options.offline && !touca::seal()) {
    touca::print_warning("failed to seal this version\n");
  }

  logger.info("completed workflow");
  return EXIT_SUCCESS;
}

void Runner::run_testcase(const Workflow& workflow, const std::string& testcase,
                          const unsigned index) {
  std::vector<std::string> errors;
  auto outputDirCase = touca::filesystem::path(options.output_dir) /
                       options.suite / options.revision / testcase;

  // unless `overwrite` is specified, check whether to skip this testcase.
  if (!options.overwrite && workflow.skip(testcase)) {
    logger.info(fmt::format("skipping processed testcase: {}", testcase));
    stats.inc(Status::Skip);
    printer.print_progress(testcase, index, testcase_width, timer, errors);
    return;
  }

  touca::declare_testcase(testcase);

  // remove result directory for this testcase if it already exists.
  // since subsequent operations may expect to write into this directory,
  // we wait a few milliseconds to ensure it is entirely removed from disk.
  if (touca::filesystem::exists(outputDirCase.string())) {
    touca::filesystem::remove_all(outputDirCase);
    logger.debug(fmt::format("removed result directory for {}", testcase));
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
  }
  touca::filesystem::create_directories(outputDirCase);

  // execute workflow for this testcase
  logger.info(fmt::format("processing testcase: {}", testcase));
  timer.tic(testcase);
  OutputCapturer capturer;
  if (options.redirect) {
    capturer.start_capture();
  }

  try {
    errors = workflow.execute(testcase);
  } catch (const std::exception& ex) {
    errors = {ex.what()};
  } catch (...) {
    errors = {"unknown exception"};
  }

  if (options.redirect) {
    capturer.stop_capture();
  }
  timer.toc(testcase);
  stats.inc(errors.empty() ? Status::Pass : Status::Fail);
  logger.info(fmt::format("processed testcase: {}", testcase));

  if (!capturer.cerr().empty()) {
    const auto resultFile = outputDirCase / "stderr.txt";
    touca::detail::save_string_file(resultFile.string(), capturer.cerr());
  }

  if (!capturer.cout().empty()) {
    const auto resultFile = outputDirCase / "stdout.txt";
    touca::detail::save_string_file(resultFile.string(), capturer.cout());
  }

  if (errors.empty() && options.save_binary) {
    const auto resultFile = outputDirCase / "touca.bin";
    touca::save_binary(resultFile.string(), {testcase});
  }

  if (errors.empty() && options.save_json) {
    const auto resultFile = outputDirCase / "touca.json";
    touca::save_json(resultFile.string(), {testcase});
  }

  if (!options.offline && !touca::post()) {
    logger.error("failed to submit results");
  }

  printer.print_progress(testcase, index, testcase_width, timer, errors);
  touca::forget_testcase(testcase);
}

int main(int argc, char* argv[], Workflow& workflow) {
  try {
    return Runner().run_workflow(argc, argv, workflow);
  } catch (const std::exception& ex) {
    touca::print_error("failed to run workflow: {}\n", ex.what());
    return EXIT_FAILURE;
  } catch (...) {
    touca::print_error("failed to run workflow: unknown error\n");
    return EXIT_FAILURE;
  }
}

}  // namespace touca
