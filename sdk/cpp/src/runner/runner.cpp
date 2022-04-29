// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/runner/runner.hpp"

#include <fstream>
#include <iostream>
#include <memory>
#include <numeric>
#include <string>
#include <thread>
#include <unordered_map>

#include "fmt/color.h"
#include "fmt/ostream.h"
#include "fmt/printf.h"
#include "touca/core/config.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/devkit/platform.hpp"
#include "touca/devkit/utils.hpp"
#include "touca/runner/detail/helpers.hpp"
#include "touca/runner/detail/options.hpp"
#include "touca/touca.hpp"

#ifdef _WIN32
#undef GetObject
#endif

namespace touca {

struct {
  std::function<void(FrameworkOptions&)> config;
  std::vector<std::pair<std::unique_ptr<Sink>, Sink::Level>> sinks;
  std::map<std::string, Runner::Workflow> workflows;
} _meta;

void configure(const std::function<void(FrameworkOptions&)> func) {
  _meta.config = func;
}

void workflow(const std::string& name, const Runner::Workflow workflow) {
  _meta.workflows.emplace(name, workflow);
}

void add_sink(std::unique_ptr<Sink> sink, const Sink::Level level) {
  _meta.sinks.push_back(std::make_pair(std::move(sink), level));
}

void reset_test_runner() {
  _meta.config = nullptr;
  _meta.sinks.clear();
  _meta.workflows.clear();
}

int run(int argc, char* argv[]) {
  auto status = 0u;
  for (const auto& workflow : _meta.workflows) {
    try {
      status += touca::Runner(argc, argv).run(workflow.second);
    } catch (const std::exception& ex) {
      touca::print_error("failed to run workflow: {}\n", ex.what());
      status++;
    } catch (...) {
      touca::print_error("failed to run workflow: unknown error\n");
      status++;
    }
  }
  return status ? EXIT_FAILURE : EXIT_SUCCESS;
}

bool skip_testcase(const FrameworkOptions& options,
                   const std::string& testcase) {
  auto output_dir_case = touca::filesystem::path(options.output_dir) /
                         options.suite / options.revision / testcase;
  if (options.save_binary) {
    output_dir_case /= "touca.bin";
  } else if (options.save_json) {
    output_dir_case /= "touca.json";
  } else {
    return false;
  }
  return touca::filesystem::exists(output_dir_case.string());
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
  if (std::find(levels.begin(), levels.end(), level) == levels.end()) {
    touca::print_error(
        "value of option \"--log-level\" must be one of \"debug\", \"info\" "
        "or \"warning\".\n");
    return false;
  }

  return true;
}

void Logger::debug(const std::string& msg) const {
  publish(Sink::Level::Debug, msg);
}
void Logger::info(const std::string& msg) const {
  publish(Sink::Level::Info, msg);
}
void Logger::warn(const std::string& msg) const {
  publish(Sink::Level::Warn, msg);
}
void Logger::error(const std::string& msg) const {
  publish(Sink::Level::Error, msg);
}

void Logger::add_sink(std::unique_ptr<Sink> sink, const Sink::Level level) {
  _sinks.push_back(std::make_pair(std::move(sink), level));
}

void Logger::publish(const Sink::Level level, const std::string& msg) const {
  for (const auto& kvp : _sinks) {
    if (kvp.second <= level) {
      kvp.first->log(level, msg);
    }
  }
}

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

void Statistics::inc(Status value) {
  if (!_v.count(value)) {
    _v[value] = 0u;
  }
  _v[value] += 1u;
}

unsigned long Statistics::count(Status value) const {
  return _v.count(value) ? _v.at(value) : 0u;
}

void Timer::tic(const std::string& key) {
  _tics[key] = std::chrono::system_clock::now();
}

void Timer::toc(const std::string& key) {
  _tocs[key] = std::chrono::system_clock::now();
}

long long Timer::count(const std::string& key) const {
  const auto& dur = _tocs.at(key) - _tics.at(key);
  return std::chrono::duration_cast<std::chrono::milliseconds>(dur).count();
}

void Printer::update(const touca::filesystem::path& path,
                     const bool colored_output) {
  _color = colored_output;
  _file = std::ofstream(path.string(), std::ios::trunc);
}

void Printer::print_header(const FrameworkOptions& options) {
  print("\nTouca Test Framework\nSuite: {}/{}\n\n", options.suite,
        options.revision);
}

void Printer::print_progress(const unsigned index, const Status status,
                             const std::string& testcase, const Timer& timer,
                             const std::vector<std::string>& errors) {
  const auto& row_pad = std::floor(std::log10(testcase_count)) + 1;
  const auto& badge_color = fmt::bg(std::get<0>(_states.at(status)));
  const auto& badge_text = std::get<1>(_states.at(status));

  print(" {:>{}}", index + 1, static_cast<int>(row_pad));
  print(fmt::fg(fmt::terminal_color::bright_black), ". ");
  print(badge_color, " {} ", badge_text);
  print("  {:<{}}", testcase, testcase_width);

  if (status != Status::Skip) {
    print(fmt::fg(fmt::terminal_color::bright_black), "    ({:d} ms)",
          timer.count(testcase));
  }
  print("\n");
  if (errors.empty()) {
    return;
  }
  print(fmt::fg(fmt::terminal_color::bright_black), "\n   Exception Raised:\n");
  for (const auto& err : errors) {
    print("      - {}\n", err);
  }
  print("\n");
}

void Printer::print_footer(const Statistics& stats, Timer& timer,
                           const unsigned suiteSize) {
  const auto duration = timer.count("__workflow__") / 1000.0;
  const auto report = [&](const Status state, const fmt::terminal_color color,
                          const std::string& name) {
    if (stats.count(state)) {
      print(fmt::fg(color), "{} {}", stats.count(state), name);
      print(", ");
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

Runner::Runner(int argc, char* argv[]) {
  if (!parse_options(argc, argv, options)) {
    fmt::print(std::cerr, cli_help_description());
    throw std::runtime_error("failed to parse options");
  }
  if (options.has_help || options.has_version) {
    return;
  }
  if (!validate_options(options)) {
    throw std::runtime_error("failed to validate configuration options.");
  }
}

int Runner::run(const Runner::Workflow workflow) {
  // if user asks for help, print help message and exit
  if (options.has_help) {
    fmt::print(std::cout, "{}\n", cli_help_description());
    return EXIT_SUCCESS;
  }

  // if user asks for version, print app version and exit
  if (options.has_version) {
    fmt::print(std::cout, "{}.{}.{}\n", TOUCA_VERSION_MAJOR,
               TOUCA_VERSION_MINOR, TOUCA_VERSION_PATCH);
    return EXIT_SUCCESS;
  }

  // always print warning and errors log events to console
  logger.add_sink(touca::detail::make_unique<ConsoleSink>(), Sink::Level::Warn);

  // establish output directory for this revision

  const auto& output_dir_version = touca::filesystem::path(options.output_dir) /
                                   options.suite / options.revision;
  touca::filesystem::create_directories(output_dir_version);

  // unless explicitly instructed not to do so, register a separate
  // file logger to write our events to a file in the output directory.
  if (!options.skip_logs) {
    logger.add_sink(touca::detail::make_unique<FileSink>(output_dir_version),
                    find_log_level(options.log_level));
    logger.debug("registered default file logger");
  }

  for (auto& sink : _meta.sinks) {
    logger.add_sink(std::move(sink.first), sink.second);
  }

  for (const auto& opt : options.extra) {
    logger.debug(fmt::format("{0:<16}: {1}", opt.first, opt.second));
  }

  // Create a stream that simultaneously writes certain output
  // information printed on console to a file `Console.log` in
  // output directory for this revision.
  printer.update(output_dir_version / "Console.log", options.colored_output);

  // Provide feedback to user that regression test is starting.
  // We perform this operation prior to configuring Touca client,
  // which may take a noticeable time.
  printer.print_header(options);

  if (_meta.config) {
    _meta.config(options);
  }
  touca::configure(options);

  // check that the client is properly configured
  if (!touca::is_configured()) {
    logger.error(fmt::format("failed to configure touca client: {}",
                             touca::configuration_error()));
    return EXIT_FAILURE;
  }
  logger.info("configured touca client");

  if (options.testcases.empty() && !options.testcase_file.empty()) {
    options.testcases = touca::get_testsuite_local(options.testcase_file);
  }
  if (options.testcases.empty() && !options.offline) {
    options.testcases = touca::get_testsuite_remote(options);
  }
  if (options.testcases.empty()) {
    logger.error("unable to proceed with empty list of testcases");
    return EXIT_FAILURE;
  }

  printer.testcase_count = options.testcases.size();
  printer.testcase_width =
      std::accumulate(options.testcases.begin(), options.testcases.end(), 0ul,
                      [](const size_t sum, const std::string& testcase) {
                        return std::max(sum, testcase.length());
                      });

  // iterate over testcases and execute the workflow for each testcase.
  timer.tic("__workflow__");
  auto index = 0u;
  for (const auto& testcase : options.testcases) {
    run_testcase(workflow, testcase, index++);
  }
  timer.toc("__workflow__");

  printer.print_footer(stats, timer, options.testcases.size());

  if (!options.offline && !touca::seal()) {
    touca::print_warning("failed to seal this version\n");
  }

  logger.info("completed workflow");
  return EXIT_SUCCESS;
}

void Runner::run_testcase(const Runner::Workflow workflow,
                          const std::string& testcase, const unsigned index) {
  std::vector<std::string> errors;
  auto output_dir_case = touca::filesystem::path(options.output_dir) /
                         options.suite / options.revision / testcase;

  // unless `overwrite` is specified, check whether to skip this testcase.
  if (!options.overwrite && skip_testcase(options, testcase)) {
    logger.info(fmt::format("skipping processed testcase: {}", testcase));
    stats.inc(Status::Skip);
    printer.print_progress(index, Status::Skip, testcase, timer);
    return;
  }

  touca::declare_testcase(testcase);

  // remove result directory for this testcase if it already exists.
  // since subsequent operations may expect to write into this directory,
  // we wait a few milliseconds to ensure it is entirely removed from disk.
  if (touca::filesystem::exists(output_dir_case.string())) {
    touca::filesystem::remove_all(output_dir_case);
    logger.debug(fmt::format("removed result directory for {}", testcase));
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
  }
  touca::filesystem::create_directories(output_dir_case);

  // execute workflow for this testcase
  logger.info(fmt::format("processing testcase: {}", testcase));
  timer.tic(testcase);
  OutputCapturer capturer;
  if (options.redirect) {
    capturer.start_capture();
  }

  try {
    workflow(testcase);
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
    const auto resultFile = output_dir_case / "stderr.txt";
    touca::detail::save_string_file(resultFile.string(), capturer.cerr());
  }

  if (!capturer.cout().empty()) {
    const auto resultFile = output_dir_case / "stdout.txt";
    touca::detail::save_string_file(resultFile.string(), capturer.cout());
  }

  if (errors.empty() && options.save_binary) {
    const auto resultFile = output_dir_case / "touca.bin";
    touca::save_binary(resultFile.string(), {testcase});
  }

  if (errors.empty() && options.save_json) {
    const auto resultFile = output_dir_case / "touca.json";
    touca::save_json(resultFile.string(), {testcase});
  }

  if (!options.offline && !touca::post()) {
    logger.error("failed to submit results");
  }

  const auto& status = errors.empty() ? Status::Pass : Status::Fail;
  printer.print_progress(index, status, testcase, timer, errors);
  touca::forget_testcase(testcase);
}

}  // namespace touca
