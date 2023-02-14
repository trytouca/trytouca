// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/runner/runner.hpp"

#include <algorithm>
#include <fstream>
#include <iostream>
#include <memory>
#include <numeric>
#include <stdexcept>
#include <string>
#include <thread>
#include <unordered_map>
#include <vector>

#include "fmt/color.h"
#include "fmt/ostream.h"
#include "fmt/printf.h"
#include "touca/core/config.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/core/transport.hpp"
#include "touca/runner/detail/helpers.hpp"
#include "touca/touca.hpp"

namespace touca {
namespace detail {

using Status = Post::Status;

struct {
  RunnerOptions options;
  std::vector<std::pair<std::unique_ptr<Sink>, Sink::Level>> sinks;
} _meta;

OutputCapturer::OutputCapturer() {}

OutputCapturer::~OutputCapturer() {
  if (_capturing) {
    stop_capture();
  }
}

void OutputCapturer::start_capture() {
  _buf_err.str("");
  _buf_err.clear();
  _err = std::cerr.rdbuf(_buf_err.rdbuf());

  _buf_out.str("");
  _buf_out.clear();
  _out = std::cout.rdbuf(_buf_out.rdbuf());

  _capturing = true;
}

void OutputCapturer::stop_capture() {
  std::cerr.rdbuf(_err);
  std::cout.rdbuf(_out);
  _capturing = false;
}

std::string OutputCapturer::cerr() const { return _buf_err.str(); }

std::string OutputCapturer::cout() const { return _buf_out.str(); }

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
  switch (log_level) {
    case Sink::Level::Debug:
      return "debug";
    case Sink::Level::Info:
      return "info";
    case Sink::Level::Warn:
      return "warning";
    case Sink::Level::Error:
      return "error";
  }

  throw touca::detail::runtime_error("log level invalid");
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

    std::stringstream thread_stamp;
    thread_stamp << std::this_thread::get_id();

    _ofs << touca::detail::format("{} {} {:<8} {}\n", timestamp,
                                  thread_stamp.str(), stringify(level), msg);
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
    _v[value] = 0U;
  }
  _v[value] += 1U;
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

void Printer::print_app_header() { print("\nTouca Test Runner\n"); }

void Printer::print_app_footer() { print("\n✨   Ran all test suites.\n\n"); }

void Printer::print_header(const std::string& suite,
                           const std::string& version) {
  print("\nSuite: {}/{}\n\n", suite, version);
}

void Printer::print_error(const std::string& msg) {
  print(fmt::fg(fmt::terminal_color::red), "{}\n", msg);
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
                           const Workflow workflow,
                           const RunnerOptions& options) {
  const auto duration = timer.count("__workflow__") / 1000.0;
  const auto report = [&](const Status state, const fmt::terminal_color color,
                          const std::string& name) {
    if (stats.count(state)) {
      print(fmt::fg(color), "{} {}", stats.count(state), name);
      print(", ");
    }
  };
  print("\nTests:      ");
  report(Status::Sent, fmt::terminal_color::green, "submitted");
  report(Status::Skip, fmt::terminal_color::yellow, "skipped");
  report(Status::Fail, fmt::terminal_color::red, "failed");
  report(Status::Pass, fmt::terminal_color::green, "perfect");
  report(Status::Diff, fmt::terminal_color::yellow, "different");
  print("{} total\n", static_cast<unsigned int>(workflow.testcases.size()));
  print("Time:       {:.2f} s\n", duration);
  if (!options.web_url.empty()) {
    print("Link:       {}/~/{}/{}/{}\n", options.web_url, options.team,
          workflow.suite, workflow.version);
  }
  if (options.save_binary || options.save_json) {
    const auto& results_dir =
        touca::filesystem::path(options.output_directory) / workflow.suite /
        workflow.version;
    print("Results:    {}\n", results_dir.string());
  }
}

void Runner::run_workflows() {
  if (!options.output_directory.empty() &&
      (options.save_binary || options.save_json)) {
    touca::filesystem::create_directories(options.output_directory);
  }
  printer.print_app_header();
  for (const auto& workflow : options.workflows) {
    try {
      run_workflow(workflow);
    } catch (const std::exception& ex) {
      printer.print_error(
          touca::detail::format("\nError when running suite \"{}\":\n{}\n",
                                workflow.suite, ex.what()));
    }
  }
  printer.print_app_footer();
}

void Runner::run_workflow(const Workflow& workflow) {
  ClientOptions o(options);
  o.suite = workflow.suite;
  o.version = workflow.version;
  touca::detail::set_client_options(o);

  // always print warning and errors log events to console
  logger.add_sink(touca::detail::make_unique<ConsoleSink>(), Sink::Level::Warn);

  // establish output directory for this workflow
  const auto& version_directory =
      touca::filesystem::path(options.output_directory) / workflow.suite /
      workflow.version;
  touca::filesystem::create_directories(version_directory);

  // unless explicitly instructed not to do so, register a separate
  // file logger to write our events to a file in the output directory.
  if (!options.skip_logs) {
    logger.add_sink(touca::detail::make_unique<FileSink>(version_directory),
                    find_log_level(options.log_level));
    logger.debug("registered default file logger");
  }

  for (auto& sink : _meta.sinks) {
    logger.add_sink(std::move(sink.first), sink.second);
  }

  printer.output_file = std::ofstream(
      (version_directory / "Console.log").string(), std::ios::trunc);
  printer.colored_output = options.colored_output;
  printer.testcase_count = static_cast<unsigned int>(workflow.testcases.size());
  printer.testcase_width = std::accumulate(
      workflow.testcases.begin(), workflow.testcases.end(), 0U,
      [](const unsigned int sum, const std::string& testcase) {
        return std::max(sum, static_cast<unsigned int>(testcase.length()));
      });

  printer.print_header(workflow.suite, workflow.version);
  timer.tic("__workflow__");
  auto index = 0U;
  for (const auto& testcase : workflow.testcases) {
    run_testcase(workflow, testcase, index++);
  }
  timer.toc("__workflow__");
  printer.print_footer(stats, timer, workflow, options);
  if (!options.offline) {
    touca::seal();
  }
}

void Runner::run_testcase(const Workflow& workflow, const std::string& testcase,
                          const unsigned index) {
  std::vector<std::string> errors;
  auto case_directory = touca::filesystem::path(options.output_directory) /
                        workflow.suite / workflow.version / testcase;

  // unless `overwrite` is specified, check whether to skip this testcase.
  if (options.overwrite_results ? false
      : options.save_binary
          ? touca::filesystem::exists(case_directory / "touca.bin")
      : options.save_json
          ? touca::filesystem::exists(case_directory / "touca.json")
          : false) {
    logger.info(
        touca::detail::format("skipping processed testcase: {}", testcase));
    stats.inc(Status::Skip);
    printer.print_progress(index, Status::Skip, testcase, timer);
    return;
  }

  touca::declare_testcase(testcase);

  // remove result directory for this testcase if it already exists.
  // since subsequent operations may expect to write into this directory,
  // we wait a few milliseconds to ensure it is entirely removed from disk.
  if (touca::filesystem::exists(case_directory.string())) {
    touca::filesystem::remove_all(case_directory);
    logger.debug(
        touca::detail::format("removed result directory for {}", testcase));
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
  }
  touca::filesystem::create_directories(case_directory);

  logger.info(touca::detail::format("processing testcase: {}", testcase));
  timer.tic(testcase);
  OutputCapturer capturer;
  if (options.redirect_output) {
    capturer.start_capture();
  }

  try {
    workflow.callback(testcase);
  } catch (const std::exception& ex) {
    errors = {ex.what()};
  } catch (...) {
    errors = {"unknown exception"};
  }

  if (options.redirect_output) {
    capturer.stop_capture();
  }
  timer.toc(testcase);
  Status status = errors.empty() ? Status::Sent : Status::Fail;

  if (!capturer.cerr().empty()) {
    const auto resultFile = case_directory / "stderr.txt";
    touca::detail::save_text_file(resultFile.string(), capturer.cerr());
  }
  if (!capturer.cout().empty()) {
    const auto resultFile = case_directory / "stdout.txt";
    touca::detail::save_text_file(resultFile.string(), capturer.cout());
  }
  if (errors.empty() && options.save_binary) {
    const auto resultFile = case_directory / "touca.bin";
    touca::save_binary(resultFile.string(), {testcase});
  }
  if (errors.empty() && options.save_json) {
    const auto resultFile = case_directory / "touca.json";
    touca::save_json(resultFile.string(), {testcase});
  }
  if (errors.empty() && !options.offline) {
    Post::Options opts;
    opts.submit_async = options.submit_async;
    status = touca::post(opts);
  }

  stats.inc(status);
  printer.print_progress(index, status, testcase, timer, errors);
  touca::forget_testcase(testcase);
  logger.info(touca::detail::format("processed testcase: {}", testcase));
}

void reset_test_runner() {
  _meta.options = RunnerOptions();
  _meta.sinks.clear();
}
}  // namespace detail

void configure_runner(
    const std::function<void(RunnerOptions&)> options_callback) {
  if (options_callback) {
    options_callback(touca::detail::_meta.options);
  }
}

void workflow(const std::string& name,
              const std::function<void(const std::string&)> workflow_callback,
              const std::function<void(WorkflowOptions&)> options_callback) {
  Workflow workflow;
  workflow.suite = name;
  workflow.callback = workflow_callback;
  if (options_callback) {
    options_callback(workflow);
  }
  touca::detail::_meta.options.workflows.push_back(workflow);
}

void add_sink(std::unique_ptr<Sink> sink, const Sink::Level level) {
  touca::detail::_meta.sinks.push_back(std::make_pair(std::move(sink), level));
}

int run(int argc, char* argv[]) {
  try {
    touca::detail::update_runner_options(argc, argv,
                                         touca::detail::_meta.options);
    touca::detail::Runner(touca::detail::_meta.options).run_workflows();
  } catch (const touca::detail::graceful_exit_error& ex) {
    fmt::print(std::cout, "{}\n", ex.what());
    return EXIT_SUCCESS;
  } catch (const touca::detail::runtime_error& ex) {
    fmt::print(
        std::cerr,
        fmt::format(fmt::fg(fmt::terminal_color::red),
                    "Failed to configure the test runner: {}\n", ex.what()));
    return EXIT_FAILURE;
  }
  return EXIT_SUCCESS;
}

}  // namespace touca
