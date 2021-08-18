// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "framework.hpp"
#include "framework/suites.hpp"
#include <memory>
#include <string>

// the following header file(s) are included only to make it sufficient
// for the users of this library to include only this header file

#include "touca/touca.hpp"

namespace touca {
    void main(const std::string& testcase);
}

/**
 *
 */
class MyWorkflow : public touca::framework::Workflow {
public:
    std::shared_ptr<touca::framework::Suite> suite() const override
    {
        return std::make_shared<touca::framework::RemoteSuite>(_options);
    }
    touca::framework::Errors execute(const touca::framework::Testcase& testcase) const override
    {
        touca::main(testcase);
        return {};
    }
};

/**
 *
 */
int main(int argc, char* argv[])
{
    MyWorkflow workflow;
    touca::framework::main(argc, argv, workflow);
}
