// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "students.hpp"

#include "students_types.hpp"
#include "touca/touca_main.hpp"

void touca::main(const std::string& username) {
  const auto& student = parse_profile(username);
  touca::add_assertion("username", student.username);
  touca::add_result("fullname", student.fullname);
  touca::add_result("birth_date", student.dob);
  touca::add_result("gpa", student.gpa);
  touca::add_metric("external_source", 1500);
}
