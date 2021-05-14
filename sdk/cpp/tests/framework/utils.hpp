/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "touca/framework.hpp"
#include "touca/framework/detail/utils.hpp"
#include "touca/touca.hpp"
#include <iostream>

struct DummySuite final : public touca::framework::Suite {
};

struct SimpleSuite final : public touca::framework::Suite {
    using Inputs = std::vector<touca::framework::Testcase>;
    SimpleSuite(const Inputs& inputs)
        : Suite()
        , _inputs(inputs)
    {
    }
    void initialize()
    {
        std::for_each(_inputs.begin(), _inputs.end(), [this](const Inputs::value_type& i) { push(i); });
    }
    Inputs _inputs;
};

struct DummyWorkflow : public touca::framework::Workflow {
    std::shared_ptr<touca::framework::Suite> suite() const override
    {
        return std::make_shared<DummySuite>();
    }
    touca::framework::Errors execute(const touca::framework::Testcase& testcase) const override
    {
        std::ignore = testcase;
        return {};
    }
    bool skip(const touca::framework::Testcase& testcase) const override
    {
        return testcase == "case-to-exclude";
    }
    std::string describe_options() const override
    {
        return "Workflow specific help message";
    }
};

struct SimpleWorkflow : public touca::framework::Workflow {
    SimpleWorkflow()
        : Workflow()
    {
    }
    std::shared_ptr<touca::framework::Suite> suite() const override
    {
        SimpleSuite::Inputs inputs = { "4", "8", "15", "16", "23", "42" };
        return std::make_shared<SimpleSuite>(inputs);
    }
    touca::framework::Errors execute(const touca::framework::Testcase& testcase) const override
    {
        if (testcase == "8") {
            std::cout << "simple message in output stream" << std::endl;
            std::cerr << "simple message in error stream" << std::endl;
        }
        if (testcase == "42") {
            return { "some-error" };
        }
        if (testcase == "4") {
            touca::add_result("some-number", 1024);
            touca::add_result("some-string", "foo");
            touca::add_array_element("some-array", "bar");
        }
        return {};
    }
};

template <class Workflow>
class MainCaller {
public:
    void call_with(const std::vector<std::string>& args)
    {
        std::vector<char*> argv;
        argv.push_back((char*)"myapp");
        for (const auto& arg : args) {
            argv.push_back((char*)arg.data());
        }
        argv.push_back(nullptr);

        capturer.start_capture();
        exit_status = touca::framework::main(argv.size() - 1, argv.data(), workflow);
        capturer.stop_capture();
    }

    inline int exit_code() const { return exit_status; }
    inline std::string cerr() const { return capturer.cerr(); }
    inline std::string cout() const { return capturer.cout(); }

private:
    int exit_status = 0;
    Workflow workflow;
    OutputCapturer capturer;
};

struct ResultChecker {

public:
    ResultChecker(const std::vector<touca::filesystem::path>& segments)
    {
        _path = segments.front();
        for (auto i = 1ul; i < segments.size(); i++) {
            _path /= segments[i];
        }
    }

    std::vector<touca::filesystem::path> get_regular_files(const std::string& filename) const
    {
        return get_elements(filename, [](const touca::filesystem::path& path) {
            return touca::filesystem::is_regular_file(path);
        });
    }

    std::vector<touca::filesystem::path> get_directories(const std::string& filename) const
    {
        return get_elements(filename, [](const touca::filesystem::path& path) {
            return touca::filesystem::is_directory(path);
        });
    }

private:
    std::vector<touca::filesystem::path> get_elements(
        const std::string& filename,
        const std::function<bool(touca::filesystem::path)> filter) const
    {
        std::vector<touca::filesystem::path> filenames;
        for (const auto& entry : touca::filesystem::directory_iterator(_path / filename)) {
            if (filter(entry.path())) {
                filenames.emplace_back(entry.path().filename());
            }
        }
        return filenames;
    }

    touca::filesystem::path _path;
};
