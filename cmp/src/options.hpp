// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <filesystem>
#include <optional>
#include <string>

/**
 *
 */
struct Options {
  std::optional<bool> help;
  std::string api_url;
  std::string log_level;
  std::optional<std::filesystem::path> log_dir;
  unsigned max_failures;
  unsigned polling_interval;
  unsigned processor_threads;
  unsigned startup_interval;
  unsigned startup_timeout;
  unsigned status_report_interval;
  unsigned minio_proxy_port;
  std::string minio_proxy_host;
  std::string minio_url;
  std::string minio_pass;
  std::string minio_user;
  std::string minio_region;
};

/**
 *
 */
bool parse_arguments(int argc, char* argv[], Options& options);
