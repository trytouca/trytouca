// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <cstdint>
#include <fstream>
#include <iostream>
#include <memory>
#include <sstream>
#include <string>
#include <tuple>
#include <unordered_map>
#include <vector>

#include "fmt/color.h"
#include "touca/lib_api.hpp"
#include "touca/runner/runner.hpp"

namespace touca {
namespace detail {

enum Status : uint8_t { Pass, Fail, Skip };

struct Statistics {
  void inc(Status value);
  unsigned long count(Status value) const;

 private:
  std::map<Status, unsigned long> _v;
};

struct Timer {
  void tic(const std::string& key);
  void toc(const std::string& key);
  long long count(const std::string& key) const;

 private:
  std::unordered_map<std::string, std::chrono::system_clock::time_point> _tics;
  std::unordered_map<std::string, std::chrono::system_clock::time_point> _tocs;
};

struct Logger {
  void debug(const std::string& msg) const;
  void info(const std::string& msg) const;
  void warn(const std::string& msg) const;
  void error(const std::string& msg) const;
  void add_sink(std::unique_ptr<Sink> sink, const Sink::Level level);

 private:
  void publish(const Sink::Level level, const std::string& msg) const;
  std::vector<std::pair<std::unique_ptr<Sink>, Sink::Level>> _sinks;
};

struct Printer {
  bool colored_output;        // print output with ansi color
  unsigned testcase_count;    // number of testcases
  unsigned testcase_width;    // longest testcase length
  std::ofstream output_file;  // file to write output to

  void print_app_header();
  void print_app_footer();
  void print_header(const std::string& suite, const std::string& version);
  void print_progress(const unsigned index, const Status status,
                      const std::string& testcase, const Timer& timer,
                      const std::vector<std::string>& errors = {});

  void print_footer(const Statistics& stats, Timer& timer,
                    const unsigned suiteSize);
  void print_error(const std::string& msg);

 private:
  template <typename... Args>
  void print(const std::string& fmtstr, Args&&... args) {
    const auto& content = fmt::format(fmtstr, std::forward<Args>(args)...);
    fmt::print(output_file, "{}", content);
    fmt::print(std::cout, "{}", content);
    output_file.flush();
    std::cout.flush();
  }

  template <typename... Args>
  void print(const fmt::text_style& style, const std::string& fmtstr,
             Args&&... args) {
    const auto& content = fmt::format(fmtstr, std::forward<Args>(args)...);
    fmt::print(output_file, "{}", content);
    fmt::print(std::cout, "{}",
               colored_output ? fmt::format(style, content) : content);
    output_file.flush();
    std::cout.flush();
  }

  const std::map<Status, std::tuple<fmt::terminal_color, std::string>> _states =
      {{Status::Pass, std::make_tuple(fmt::terminal_color::green, "PASS")},
       {Status::Skip, std::make_tuple(fmt::terminal_color::yellow, "SKIP")},
       {Status::Fail, std::make_tuple(fmt::terminal_color::red, "FAIL")}};
};

/**
 * @brief Captures content printed to standard output and error streams.
 */
struct TOUCA_CLIENT_API OutputCapturer {
  OutputCapturer();
  ~OutputCapturer();

  void start_capture();
  void stop_capture();

  std::string cerr() const;
  std::string cout() const;

 private:
  bool _capturing = false;
  std::streambuf* _err;
  std::streambuf* _out;
  std::stringstream _buf_err;
  std::stringstream _buf_out;
};

struct TOUCA_CLIENT_API Runner {
  Runner(const RunnerOptions& opts) : options(opts) {}
  void run_workflows();

 private:
  void run_workflow(const Workflow& workflow);
  void run_testcase(const Workflow& workflow, const std::string& testcase,
                    const unsigned index);

  Timer timer;
  Logger logger;
  Printer printer;
  Statistics stats;
  const RunnerOptions& options;
};

void reset_test_runner();

}  // namespace detail
}  // namespace touca
