// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <string>
#include <unordered_map>
#include <vector>

namespace touca {
struct ClientOptions {
  explicit ClientOptions() = default;
  std::vector<std::string> testcases;
  std::string api_key;  /**< API Key to authenticate to the Touca server */
  std::string api_url;  /**< URL to Touca server API */
  std::string team;     /**< version of code under test */
  std::string suite;    /**< Suite to which results should be submitted */
  std::string revision; /**< Team to which this suite belongs */
  bool offline = false; /**< Perform server handshake during configuration */
  bool single_thread = false; /**< Isolates testcase scope to calling thread */
};

void parse_env_variables(ClientOptions& options);

bool reformat_options(ClientOptions& existing);

void parse_options(const std::unordered_map<std::string, std::string>& options,
                   ClientOptions& existing);

std::unordered_map<std::string, std::string> load_options(
    const std::string& path);
}  // namespace touca
