// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "code_under_test.hpp"
#include "rapidjson/document.h"
#include "touca/devkit/filesystem.hpp"
#include "touca/extra/scoped_timer.hpp"
#include "touca/touca.hpp"
#include <fstream>
#include <numeric>
#include <thread>

#ifdef _WIN32
#undef GetObject
#endif

/**
 *
 */
Student parse_profile(const std::string& path)
{
    std::ifstream ifs(path, std::ios::in);
    std::string content(
        (std::istreambuf_iterator<char>(ifs)),
        std::istreambuf_iterator<char>());

    Student student;
    student.username = touca::filesystem::path(path).stem().string();

    rapidjson::Document doc;
    if (doc.Parse<0>(content.c_str()).HasParseError()) {
        throw std::runtime_error("failed to parse profile");
    }

    if (doc.HasMember("name")) {
        student.fullname = doc["name"].GetString();
    }
    if (doc.HasMember("dob")) {
        const auto& rjDob = doc["dob"].GetObject();
        const auto y = static_cast<unsigned short>(rjDob["y"].GetInt());
        const auto m = static_cast<unsigned short>(rjDob["m"].GetInt());
        const auto d = static_cast<unsigned short>(rjDob["d"].GetInt());
        student.dob = { y, m, d };
    }
    if (doc.HasMember("courses")) {
        std::vector<Course> courses;
        const auto& rjCourses = doc["courses"].GetArray();
        for (rapidjson::SizeType i = 0; i < rjCourses.Size(); i++) {
            const auto& rjCourse = rjCourses[i].GetObject();
            Course course { rjCourse["name"].GetString(), rjCourse["grade"].GetFloat() };
            courses.emplace_back(course);
        }
        student.courses = courses;
    }
    return student;
}

/**
 *
 */
float calculate_gpa(const std::vector<Course>& courses)
{
    const auto& func = [](const double& sum, const Course& course) {
        std::this_thread::sleep_for(std::chrono::milliseconds(50 + rand() % 10));
        return course.grade + sum;
    };
    return std::accumulate(courses.begin(), courses.end(), 0.0, func) / courses.size();
}

/**
 *
 */
void custom_function_1(const Student& student)
{
    TOUCA_SCOPED_TIMER;
    touca::add_result("is_adult", 18 <= 2021 - student.dob._year);
    std::this_thread::sleep_for(std::chrono::milliseconds(10 + rand() % 50));
}

/**
 *
 */
void custom_function_2(const Student& student)
{
    for (auto i = 0ul; i < student.courses.size(); ++i) {
        touca::scoped_timer timer("func2_course_" + std::to_string(i));
        touca::add_hit_count("number of courses");
        std::this_thread::sleep_for(std::chrono::milliseconds(10 + rand() % 50));
    }
}

/**
 *
 */
void custom_function_3(const Student& student)
{
    for (const auto& course : student.courses) {
        touca::add_array_element("course_names", course.name);
    }
    std::this_thread::sleep_for(std::chrono::milliseconds(10 + rand() % 50));
}
