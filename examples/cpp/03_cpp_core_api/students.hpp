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

float calculate_gpa(const std::vector<Course>& courses);
Student find_student(const std::string& username);
