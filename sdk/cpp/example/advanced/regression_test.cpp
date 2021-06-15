// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "regression_test.hpp"
#include "code_under_test.hpp"
#include "cxxopts.hpp"
#include "touca/devkit/filesystem.hpp"
#include "touca/framework/suites.hpp"
#include "touca/touca.hpp"
#include <iostream>
#include <thread>

/**
 *
 */
int main(int argc, char* argv[])
{
    MyWorkflow workflow;
    return touca::framework::main(argc, argv, workflow);
}

/**
 *
 */
MySuite::MySuite(const std::string& datasetDir)
    : _dir(datasetDir)
{
}

/**
 *
 */
void MySuite::initialize()
{
    for (const auto& it : touca::filesystem::directory_iterator(_dir)) {
        if (!touca::filesystem::is_regular_file(it.path().string())) {
            continue;
        }
        push(it.path().stem().string());
    }
}

/**
 *
 */
cxxopts::Options application_options()
{
    cxxopts::Options options { "" };
    // clang-format off
    options.add_options()
        ("datasets-dir", "path to datasets directory", cxxopts::value<std::string>())
        ("testsuite-file", "path to testsuite file", cxxopts::value<std::string>())
        ("testsuite-remote", "reuse testcases of baseline\n", cxxopts::value<std::string>()->implicit_value("true"));
    // clang-format on
    return options;
}

/**
 *
 */
MyWorkflow::MyWorkflow()
    : touca::framework::Workflow()
{
}

/**
 *
 */
std::string MyWorkflow::describe_options() const
{
    return application_options().help();
}

/**
 *
 */
bool MyWorkflow::parse_options(int argc, char* argv[])
{
    auto options = application_options();
    options.allow_unrecognised_options();
    const auto& result = options.parse(argc, argv);
    for (const auto& key : { "datasets-dir", "testsuite-file", "testsuite-remote" }) {
        if (result.count(key)) {
            _options[key] = result[key].as<std::string>();
        }
    }
    return true;
}

/**
 *
 */
bool MyWorkflow::validate_options() const
{
    // check that option `datasets-dir` is provided.

    if (!_options.count("datasets-dir")) {
        std::cerr << "required configuration option \"datasets-dir\" is missing" << std::endl;
        return false;
    }

    // check that directory pointed by option `datasets-dir` exists.

    const auto& datasetsDir = _options.at("datasets-dir");
    if (!touca::filesystem::is_directory(datasetsDir)) {
        std::cerr << "datasets directory \"" << datasetsDir << "\" does not exist" << std::endl;
        return false;
    }

    // if option `testsuite-file` is provided, check that it points to a valid
    // file.

    if (_options.count("testsuite-file")) {
        const auto& file = _options.at("testsuite-file");
        if (!touca::filesystem::is_regular_file(file)) {
            std::cerr << "testsuite file \"" << file << "\" does not exist" << std::endl;
            return false;
        }
    }

    return true;
}

/**
 *
 */
std::shared_ptr<touca::framework::Suite> MyWorkflow::suite() const
{
    // if option `testsuite-file` is specified, use the testcases listed
    // in that file. For this purpose, we use the `FileSuite` helper class
    // that is provided by the Touca test framework. It expects that the
    // testsuite file has one testcase per line, while skipping empty lines
    // and lines that start with `##`.

    if (_options.count("testsuite-file")) {
        return std::make_shared<touca::framework::FileSuite>(_options.at("testsuite-file"));
    }

    // if option `testsuite-remote` is specified, use the testcases that are
    // part of the version submitted to the Touca server that is currently
    // the suite baseline. For this purpose, we use the `RemoteSuite` helper
    // class that is provided by the Touca test framework.

    if (_options.count("testsuite-remote") && _options.at("testsuite-remote") == "true") {
        return std::make_shared<touca::framework::RemoteSuite>(_options);
    }

    // if neither options are provided, use all the profiles that exist in
    // the datasets directory as testcases.

    return std::make_shared<MySuite>(_options.at("datasets-dir"));
}

/**
 *
 */
touca::framework::Errors MyWorkflow::execute(const touca::framework::Testcase& testcase) const
{
    touca::filesystem::path caseFile = _options.at("datasets-dir");
    caseFile /= testcase + ".json";
    const auto& student = parse_profile(caseFile.string());

    touca::add_assertion("username", student.username);
    touca::add_result("fullname", student.fullname);
    touca::add_result("birth_date", student.dob);
    touca::add_result("gpa", calculate_gpa(student.courses));

    custom_function_1(student);

    std::thread t(custom_function_2, student);
    t.join();

    touca::start_timer("func3");
    custom_function_3(student);
    touca::stop_timer("func3");

    touca::add_metric("external", 10);
    return {};
}

/**
 *
 */
template <>
struct touca::convert::Conversion<Date> {
    std::shared_ptr<types::IType> operator()(const Date& value)
    {
        auto out = std::make_shared<types::Object>("Date");
        out->add("year", value._year);
        out->add("month", value._month);
        out->add("day", value._day);
        return out;
    }
};
