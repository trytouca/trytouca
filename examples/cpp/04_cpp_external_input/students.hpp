// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <string>
#include <vector>

struct Date {
  unsigned short year;
  unsigned short month;
  unsigned short day;
};

struct Course {
  std::string name;
  float grade;
};

struct Student {
  std::string username;
  std::string fullname;
  Date dob;
  std::vector<Course> courses;
};

Student find_student(const std::string& username);
float calculate_gpa(const std::vector<Course>& courses);

void custom_function_1(const Student& student);
void custom_function_2(const Student& student);
void custom_function_3(const Student& student);
