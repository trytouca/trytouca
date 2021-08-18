// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "students.hpp"
#include "students_types.hpp"
#include <numeric>
#include <thread>
#include <vector>

struct StudentData {
    std::string username;
    std::string fullname;
    Date dob;
    std::vector<Course> courses;
};

static std::vector<StudentData> students = {
    { "alice", "Alice Anderson", Date { 2006, 3, 1 },
        { Course { "math", 4.0 }, Course { "computers", 3.8 } } },
    { "bob", "Bob Brown", Date { 1996, 6, 31 },
        { Course { "english", 3.7 }, Course { "history", 3.9 } } },
    { "charlie", "Charlie Clark", Date { 2003, 9, 19 },
        { Course { "math", 2.9 }, Course { "computers", 3.7 } } }
};

float calculate_gpa(const std::vector<Course>& courses)
{
    touca::add_result("courses", courses);
    const auto& sum = std::accumulate(courses.begin(), courses.end(), 0.0f,
        [](const float sum, const Course& course) {
            return sum + course.grade;
        });
    return courses.empty() ? 0.0f : sum / courses.size();
}

Student parse_profile(const std::string& username)
{
    TOUCA_SCOPED_TIMER;
    std::this_thread::sleep_for(std::chrono::milliseconds(10 + rand() % 50));
    const auto student = std::find_if(students.begin(), students.end(), [&username](const StudentData& student) {
        return student.username == username;
    });
    if (student == students.end()) {
        throw std::invalid_argument("no student found for username: " + username);
    }
    return {
        student->username,
        student->fullname,
        student->dob,
        calculate_gpa(student->courses)
    };
}
