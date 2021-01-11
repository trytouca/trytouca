/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "weasel/framework.hpp"

/**
 *
 */
class MyWorkflow : public weasel::framework::Workflow {
public:
    MyWorkflow();
    std::string describe_options() const override;
    bool parse_options(int argc, char* argv[]) override;
    bool validate_options() const override;
    std::shared_ptr<weasel::framework::Suite> suite() const override;
    weasel::framework::Errors execute(const weasel::framework::Testcase& testcase) const override;
};

/**
 *
 */
class MySuite final : public weasel::framework::Suite {
public:
    MySuite(const std::string& datasetDir);
    void initialize() override;

private:
    std::string _dir;
};
