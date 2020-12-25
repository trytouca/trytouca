/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "tests/client/devkit/tmpfile.hpp"
#include "weasel/framework.hpp"
#include "weasel/framework/detail/utils.hpp"
#include "weasel/weasel.hpp"
#include <iostream>

struct DummySuite final : public weasel::framework::Suite
{
};

struct SimpleSuite final : public weasel::framework::Suite
{
    using Inputs = std::vector<weasel::framework::Testcase>;
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

struct DummyWorkflow : public weasel::framework::Workflow
{
    std::shared_ptr<weasel::framework::Suite> suite() const override
    {
        return std::make_shared<DummySuite>();
    }
    weasel::framework::Errors execute(const weasel::framework::Testcase& testcase) const override
    {
        std::ignore = testcase;
        return {};
    }
    bool skip(const weasel::framework::Testcase& testcase) const override
    {
        return testcase == "case-to-exclude";
    }
    std::string describe_options() const override
    {
        return "Workflow specific help message";
    }
};

struct SimpleWorkflow : public weasel::framework::Workflow
{
    SimpleWorkflow()
        : Workflow()
    {
    }
    std::shared_ptr<weasel::framework::Suite> suite() const override
    {
        SimpleSuite::Inputs inputs = { "4", "8", "15", "16", "23", "42" };
        return std::make_shared<SimpleSuite>(inputs);
    }
    weasel::framework::Errors execute(const weasel::framework::Testcase& testcase) const override
    {
        if (testcase == "8")
        {
            std::cout << "simple message in output stream" << std::endl;
            std::cerr << "simple message in error stream" << std::endl;
        }
        if (testcase == "42")
        {
            return { "some-error" };
        }
        if (testcase == "4")
        {
            weasel::add_result("some-number", 1024);
            weasel::add_result("some-string", "foo");
            weasel::add_array_element("some-array", "bar");
        }
        return {};
    }
};

template <class Workflow>
class MainCaller
{
public:
    void call_with(const std::vector<std::string>& args)
    {
        std::vector<char*> argv;
        argv.push_back((char*)"myapp");
        for (const auto& arg : args)
        {
            argv.push_back((char*)arg.data());
        }
        argv.push_back(nullptr);

        capturer.start_capture();
        exit_status = weasel::framework::main(argv.size() - 1, argv.data(), workflow);
        capturer.stop_capture();
    }

    inline int exit_code() const { return exit_status; }
    inline std::string cerr() const { return capturer.cerr(); }
    inline std::string cout() const { return capturer.cout(); }

private:
    int exit_status;
    Workflow workflow;
    OutputCapturer capturer;
};

struct ResultChecker
{

public:
    ResultChecker(const std::vector<weasel::path>& segments)
    {
        _path = segments.front();
        for (auto i = 1ul; i < segments.size(); i++)
        {
            _path /= segments[i];
        }
    }

    std::vector<std::string> get_regular_files(const std::string& filename) const
    {
        auto filter = [](const boost::filesystem::directory_entry& path) {
            return weasel::filesystem::is_regular_file(path.path().string());
        };
        return get_elements(filename, filter);
    }

    std::vector<std::string> get_directories(const std::string& filename) const
    {
        auto filter = [](const boost::filesystem::directory_entry& path) {
            return weasel::filesystem::is_directory(path.path().string());
        };
        return get_elements(filename, filter);
    }

private:
    std::vector<std::string> get_elements(
        const std::string& filename,
        const std::function<bool(boost::filesystem::directory_entry)> filter) const
    {
        std::vector<std::string> filenames;
        for (const auto& entry : boost::filesystem::directory_iterator(_path / filename))
        {
            if (filter(entry))
            {
                filenames.emplace_back(entry.path().filename().string());
            }
        }
        return filenames;
    }

    boost::filesystem::path _path;
};
