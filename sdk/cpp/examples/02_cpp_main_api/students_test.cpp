// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "students.hpp"

#include "students_types.hpp"
#include "touca/touca.hpp"

int main(int argc, char* argv[]) {
  touca::workflow("find_student", [](const std::string& username) {
    const auto& student = find_student(username);
    touca::assume("username", student.username);
    touca::check("fullname", student.fullname);
    touca::check("birth_date", student.dob);
    touca::check("gpa", student.gpa);
    touca::add_metric("external_source", 1500);
  });
  touca::run(argc, argv);
}
