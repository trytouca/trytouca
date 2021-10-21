// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "students.hpp"

#include <fstream>
#include <numeric>
#include <thread>

#include "nlohmann/json.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/extra/scoped_timer.hpp"
#include "touca/touca.hpp"

#ifdef _WIN32
#undef GetObject
#endif

Student parse_profile(const std::string& path) {
  std::ifstream ifs(path, std::ios::in);
  std::string content((std::istreambuf_iterator<char>(ifs)),
                      std::istreambuf_iterator<char>());

  Student student;
  student.username = touca::filesystem::path(path).stem().string();

  const auto& parsed = nlohmann::json::parse(content, nullptr, false);
  if (parsed.is_discarded()) {
    throw std::runtime_error("failed to parse profile");
  }

  if (parsed.contains("name") && parsed["name"].is_string()) {
    student.fullname = parsed["name"].get<std::string>();
  }
  if (parsed.contains("dob") && parsed.is_object()) {
    const auto y = static_cast<unsigned short>(parsed["dob"]["y"].get<int>());
    const auto m = static_cast<unsigned short>(parsed["dob"]["m"].get<int>());
    const auto d = static_cast<unsigned short>(parsed["dob"]["d"].get<int>());
    student.dob = {y, m, d};
  }
  if (parsed.contains("courses") && parsed.is_array()) {
    std::vector<Course> courses;
    for (const auto& course : parsed["courses"]) {
      courses.emplace_back(Course{course["name"].get<std::string>(),
                                  course["grade"].get<float>()});
    }
    student.courses = courses;
  }
  return student;
}

float calculate_gpa(const std::vector<Course>& courses) {
  const auto& func = [](const double& sum, const Course& course) {
    std::this_thread::sleep_for(std::chrono::milliseconds(50 + rand() % 10));
    return course.grade + sum;
  };
  return std::accumulate(courses.begin(), courses.end(), 0.0, func) /
         courses.size();
}

void custom_function_1(const Student& student) {
  TOUCA_SCOPED_TIMER;
  touca::check("is_adult", 18 <= 2021 - student.dob._year);
  std::this_thread::sleep_for(std::chrono::milliseconds(10 + rand() % 50));
}

void custom_function_2(const Student& student) {
  for (auto i = 0ul; i < student.courses.size(); ++i) {
    touca::scoped_timer timer("func2_course_" + std::to_string(i));
    touca::add_hit_count("number of courses");
    std::this_thread::sleep_for(std::chrono::milliseconds(10 + rand() % 50));
  }
}

void custom_function_3(const Student& student) {
  for (const auto& course : student.courses) {
    touca::add_array_element("course_names", course.name);
  }
  std::this_thread::sleep_for(std::chrono::milliseconds(10 + rand() % 50));
}
