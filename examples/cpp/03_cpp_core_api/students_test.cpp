// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "students_test.hpp"

#include <iostream>

int main() {
  touca::configure();

  if (!touca::is_configured()) {
    std::cerr << touca::configuration_error() << std::endl;
    return EXIT_FAILURE;
  }

  for (const auto& username : touca::get_testcases()) {
    touca::declare_testcase(username);

    touca::start_timer("find_student");
    const auto& student = find_student(username);
    touca::stop_timer("find_student");

    touca::assume("username", student.username);
    touca::check("fullname", student.fullname);
    touca::check("birth_date", student.dob);

    for (const auto& course : student.courses) {
      touca::add_array_element("courses", course);
      touca::add_hit_count("number of courses");
    }

    {
      touca::scoped_timer timer("calculate_gpa");
      touca::check("gpa", calculate_gpa(student.courses));
    }
    touca::add_metric("external_source", 1500);

    touca::post();
    touca::save_binary("touca_" + username + ".bin");
    touca::save_json("touca_" + username + ".json");
    touca::forget_testcase(username);
  }

  touca::seal();
}
