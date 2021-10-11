// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/framework/runner.hpp"

#include <memory>
#include <string>

#include "touca/framework.hpp"
#include "touca/framework/suites.hpp"

namespace touca {
std::vector<std::pair<std::string, std::function<void(const std::string&)>>>
    _workflows;

/**
 *
 */
void workflow(const std::string& name,
              const std::function<void(const std::string&)> workflow) {
  _workflows.push_back(std::make_pair(name, workflow));
}

/**
 *
 */
void run(int argc, char* argv[]) {
  for (const auto& workflow : _workflows) {
    struct Runner : public touca::framework::Workflow {
     public:
      Runner(const std::function<void(const std::string&)> workflow)
          : _workflow(workflow){};
      std::shared_ptr<touca::framework::Suite> suite() const override {
        return std::make_shared<touca::framework::RemoteSuite>(_options);
      }
      touca::framework::Errors execute(
          const touca::framework::Testcase& testcase) const override {
        _workflow(testcase);
        return {};
      }

     private:
      std::function<void(const std::string&)> _workflow;
    } runner(workflow.second);
    touca::framework::main(argc, argv, runner);
  }
}

}  // namespace touca
