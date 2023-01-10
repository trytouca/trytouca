// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "students.hpp"

#include <iostream>
#include <thread>

#include "cxxopts.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/touca.hpp"

struct CustomConfigurationOutput {
  touca::filesystem::path datasets_dir;
  std::vector<std::string> testcases;
};

CustomConfigurationOutput custom_configuration(int argc, char* argv[]) {
  CustomConfigurationOutput out;
  cxxopts::Options opts{""};
  opts.add_options()("datasets-dir", "path to datasets directory",
                     cxxopts::value<std::string>());
  opts.allow_unrecognised_options();
  const auto& result = opts.parse(argc, argv);
  if (!result.count("datasets-dir")) {
    throw std::invalid_argument(
        "required configuration option \"datasets-dir\" is missing");
  }
  out.datasets_dir = result["datasets-dir"].as<std::string>();
  if (!touca::filesystem::is_directory(out.datasets_dir)) {
    throw std::invalid_argument("datasets directory \"" +
                                out.datasets_dir.string() +
                                "\" does not exist");
  }
  for (const auto& it :
       touca::filesystem::directory_iterator(out.datasets_dir)) {
    if (!touca::filesystem::is_regular_file(it.path().string())) {
      continue;
    }
    out.testcases.push_back(it.path().stem().string());
  }
  return out;
}

void custom_execution(const touca::filesystem::path& caseFile) {
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
  auto out = custom_configuration(argc, argv);
  std::cout << out.testcases.size() << std::endl;
  touca::workflow(
      "external_input",
      [&out](const std::string& testcase) {
        custom_execution(out.datasets_dir / (testcase + ".json"));
      },
      [&out](touca::WorkflowOptions& x) { x.testcases = out.testcases; });
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
