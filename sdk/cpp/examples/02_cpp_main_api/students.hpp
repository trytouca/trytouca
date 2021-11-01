// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <string>

#include "touca/touca.hpp"

struct Date {
  unsigned short _year;
  unsigned short _month;
  unsigned short _day;
};

struct Course {
  std::string name;
  float grade;
};

struct Student {
  std::string username;
  std::string fullname;
  Date dob;
  float gpa;
};

Student find_student(const std::string& username);
