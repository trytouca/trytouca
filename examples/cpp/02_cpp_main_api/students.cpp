// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "students.hpp"

#include <numeric>
#include <stdexcept>
#include <thread>
#include <unordered_map>
#include <vector>

#include "students_types.hpp"

struct StudentData {
  std::string username;
  std::string fullname;
  Date dob;
  std::vector<Course> courses;
};

static std::unordered_map<std::string, StudentData> students = {
    {"alice",
     {"alice",
      "Alice Anderson",
      Date{2006, 3, 1},
      {Course{"computers", 3.8}, Course{"math", 4.0}}}},
    {"bob",
     {"bob",
      "Bob Brown",
      Date{1996, 6, 31},
      {Course{"history", 3.9}, Course{"english", 3.7}}}},
    {"charlie",
     {"charlie",
      "Charlie Clark",
      Date{2003, 9, 19},
      {Course{"computers", 3.7}, Course{"math", 2.9}}}}};

float calculate_gpa(const std::vector<Course>& courses) {
  for (const auto& course : courses) {
    touca::add_array_element("courses", course);
    touca::add_hit_count("number of courses");
  }
  const auto& sum = std::accumulate(
      courses.begin(), courses.end(), 0.0f,
      [](const float sum, const Course& course) { return sum + course.grade; });
  return courses.empty() ? 0.0f : sum / courses.size();
}

Student find_student(const std::string& username) {
  TOUCA_SCOPED_TIMER;
  std::this_thread::sleep_for(std::chrono::milliseconds(200 + rand() % 50));
  if (!students.count(username)) {
    throw std::invalid_argument("no student found for username: " + username);
  }
  const auto& student = students.at(username);
  return {student.username, student.fullname, student.dob,
          calculate_gpa(student.courses)};
}
