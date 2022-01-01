// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "touca/runner/runner.hpp"

class MyWorkflow : public touca::Workflow {
 public:
  MyWorkflow();
  std::string describe_options() const override;
  bool parse_options(int argc, char* argv[]) override;
  bool validate_options() const override;
  std::shared_ptr<touca::Suite> suite() const override;
  touca::Errors execute(const std::string& testcase) const override;
};

class MySuite final : public touca::Suite {
 public:
  MySuite(const std::string& datasetDir);
  void initialize() override;

 private:
  std::string _dir;
};
