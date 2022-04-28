// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "students.hpp"

#include <iostream>
#include <thread>

#include "cxxopts.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/touca.hpp"

struct Runner {
  void parse(int argc, char* argv[]);
  void execute(const std::string& testcase) const;

 private:
  std::string _datasets_dir;
};

void Runner::parse(int argc, char* argv[]) {
  cxxopts::Options opts{""};
  opts.add_options()("datasets-dir", "path to datasets directory",
                     cxxopts::value<std::string>());
  opts.allow_unrecognised_options();
  const auto& result = opts.parse(argc, argv);
  if (!result.count("datasets-dir")) {
    throw std::invalid_argument(
        "required configuration option \"datasets-dir\" is missing");
  }
  _datasets_dir = result["datasets-dir"].as<std::string>();
  if (!touca::filesystem::is_directory(_datasets_dir)) {
    throw std::invalid_argument("datasets directory \"" + _datasets_dir +
                                "\" does not exist");
  }
  std::vector<std::string> testcases;
  for (const auto& it : touca::filesystem::directory_iterator(_datasets_dir)) {
    if (!touca::filesystem::is_regular_file(it.path().string())) {
      continue;
    }
    testcases.push_back(it.path().stem().string());
  }
  touca::configure([testcases](touca::FrameworkOptions& options) {
    options.testcases = testcases;
  });
}

void Runner::execute(const std::string& testcase) const {
  touca::filesystem::path caseFile = _datasets_dir;
  caseFile /= testcase + ".json";
  const auto& student = find_student(caseFile.string());

  touca::assume("username", student.username);
  touca::check("fullname", student.fullname);
  touca::check("birth_date", student.dob);
  touca::check("gpa", calculate_gpa(student.courses));

  custom_function_1(student);

  std::thread t(custom_function_2, student);
  t.join();

  touca::start_timer("func3");
  custom_function_3(student);
  touca::stop_timer("func3");

  touca::add_metric("external", 10);
}

int main(int argc, char* argv[]) {
  Runner runner;
  try {
    runner.parse(argc, argv);
  } catch (const std::invalid_argument& ex) {
    std::cerr << ex.what() << std::endl;
    return EXIT_FAILURE;
  }
  touca::workflow("external_input", [&runner](const std::string& testcase) {
    runner.execute(testcase);
  });
  return touca::run(argc, argv);
}

template <>
struct touca::serializer<Date> {
  data_point serialize(const Date& value) {
    return object("Date")
        .add("year", value.year)
        .add("month", value.month)
        .add("day", value.day);
  }
};
