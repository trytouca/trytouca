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
    TOUCA_SCOPED_TIMER;
    std::this_thread::sleep_for(std::chrono::milliseconds(10 + rand() % 50));
    const auto& sum = std::accumulate(courses.begin(), courses.end(), 0.0f, [](const float sum, const Course& course) {
        return sum + course.grade;
    });
    return courses.empty() ? 0.0f : sum / courses.size();
}
