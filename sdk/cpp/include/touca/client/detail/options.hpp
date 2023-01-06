// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <string>
#include <unordered_map>
#include <vector>

#include "touca/core/filesystem.hpp"
#include "touca/core/transport.hpp"

namespace touca {

struct ClientOptions {
  std::string api_key;     /**< API Key to authenticate to the Touca server */
  std::string api_url;     /**< URL to Touca server API */
  std::string team;        /**< Team to which this suite belongs */
  std::string suite;       /**< Suite to which results should be submitted */
  std::string version;     /**< Version of code under test */
  bool offline = false;    /**< Perform server handshake during configuration */
  bool concurrency = true; /**< Isolates testcase scope to calling thread */
};

#ifdef TOUCA_INCLUDE_RUNNER

struct WorkflowOptions {
  std::string suite;
  std::string version;
  std::vector<std::string> testcases;
};

struct Workflow : public WorkflowOptions {
  std::function<void(const std::string&)> callback;
};

struct RunnerOptions : public ClientOptions {
  bool colored_output = true;
  std::string config_file;
  std::string output_directory;
  bool overwrite_results = false;
  bool save_binary = true;
  bool save_json = false;
  std::vector<std::string> testcases;
  std::string workflow_filter;
  std::vector<Workflow> workflows;
  std::string log_level = "info";
  bool skip_logs = false;
  bool redirect_output = true;
};

#endif

namespace detail {
void update_core_options(ClientOptions& options,
                         const std::unique_ptr<Transport>& transport);
void validate_core_options(const ClientOptions& options);

#ifdef TOUCA_INCLUDE_RUNNER

void update_runner_options(int argc, char* argv[], RunnerOptions& options);

void set_client_options(const ClientOptions& options);
const std::unique_ptr<Transport>& get_client_transport();
#endif

}  // namespace detail
}  // namespace touca
