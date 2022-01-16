// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <map>

#include "touca/client/detail/options.hpp"

namespace touca {
struct FrameworkOptions : public ClientOptions {
  std::map<std::string, std::string> extra;
  std::string testcase_file;
  std::string config_file;
  std::string output_dir = "./results";
  std::string log_level = "info";
  bool has_help = false;
  bool has_version = false;
  bool colored_output = true;
  bool save_binary = true;
  bool save_json = false;
  bool skip_logs = false;
  bool redirect = true;
  bool overwrite = false;
};
bool parse_options(int argc, char* argv[], FrameworkOptions& options);
std::string cli_help_description();
}  // namespace touca
