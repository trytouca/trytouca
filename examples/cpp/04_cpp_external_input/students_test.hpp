// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "touca/framework.hpp"

/**
 *
 */
class MyWorkflow : public touca::framework::Workflow {
public:
    MyWorkflow();
    std::string describe_options() const override;
    bool parse_options(int argc, char* argv[]) override;
    bool validate_options() const override;
    std::shared_ptr<touca::framework::Suite> suite() const override;
    touca::framework::Errors execute(const touca::framework::Testcase& testcase) const override;
};

/**
 *
 */
class MySuite final : public touca::framework::Suite {
public:
    MySuite(const std::string& datasetDir);
    void initialize() override;

private:
    std::string _dir;
};
