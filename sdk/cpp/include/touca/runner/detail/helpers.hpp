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

enum Status : uint8_t { Pass, Fail, Skip };

/**
 * @brief Configures the client based on a given set of configuration options
 *
 * @param options object holding configuration options
 */
void configure(const ClientOptions& options);

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
  unsigned testcase_count;  // number of testcases
  unsigned testcase_width;  // longest testcase length

  void update(const touca::filesystem::path& path, const bool colored_output);

  void print_header(const FrameworkOptions& options);

  void print_progress(const unsigned index, const Status status,
                      const std::string& testcase, const Timer& timer,
                      const std::vector<std::string>& errors = {});

  void print_footer(const Statistics& stats, Timer& timer,
                    const unsigned suiteSize);

 private:
  template <typename... Args>
  void print(const std::string& fmtstr, Args&&... args) {
    const auto& content = fmt::format(fmtstr, std::forward<Args>(args)...);
    fmt::print(_file, "{}", content);
    fmt::print(std::cout, "{}", content);
    _file.flush();
    std::cout.flush();
  }

  template <typename... Args>
  void print(const fmt::text_style& style, const std::string& fmtstr,
             Args&&... args) {
    const auto& content = fmt::format(fmtstr, std::forward<Args>(args)...);
    fmt::print(_file, "{}", content);
    fmt::print(std::cout, "{}", _color ? fmt::format(style, content) : content);
    _file.flush();
    std::cout.flush();
  }

  bool _color;
  std::ofstream _file;
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
  std::stringstream _buferr;
  std::stringstream _bufout;
};

struct TOUCA_CLIENT_API Runner {
  using Workflow = std::function<void(const std::string&)>;

  Runner(int argc, char* argv[]);
  int run(const Workflow workflow);

 private:
  void run_testcase(const Workflow workflow, const std::string& testcase,
                    const unsigned index);

  Timer timer;
  Logger logger;
  Printer printer;
  Statistics stats;
  FrameworkOptions options;
};
}  // namespace touca
