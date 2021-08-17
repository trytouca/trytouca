// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "students.hpp"
#include <numeric>
#include <thread>
#include <touca/touca.hpp>
#include <unordered_map>

/**
 *
 */
Student parse_profile(const std::string& username)
{
    static std::unordered_map<std::string, Student> students = {
        { "alice",
            Student { "alice",
                "Alice Anderson",
                Date { 2006, 3, 1 },
                { Course { "math", 4.0 }, Course { "computers", 3.8 } } } },
        { "bob",
            Student { "bob",
                "Bob Brown",
                Date { 1996, 6, 31 },
                { Course { "english", 3.7 }, Course { "history", 3.9 } } } },
        { "charlie",
            Student { "charlie",
                "Charlie Clark",
                Date { 2003, 9, 19 },
                { Course { "math", 2.9 }, Course { "computers", 3.7 } } } }
    };

    return students.at(username);
}

/**
 *
 */
float calculate_gpa(const std::vector<Course>& courses)
{
    const auto& sum = std::accumulate(courses.begin(), courses.end(), 0.0f, [](const float sum, const Course& course) {
        return sum + course.grade;
    });
    return courses.empty() ? 0.0f : sum / courses.size();
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
