// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <string>

#include "touca/touca.hpp"

struct Date {
  std::uint16_t _year;
  std::uint16_t _month;
  std::uint16_t _day;
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

Student parse_profile(const std::string& username);
