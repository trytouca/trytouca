#include "touca/touca.hpp"
#include "touca/touca_main.hpp"
#include <cmath>
#include <string>

bool is_prime(const unsigned long number)
{
    if (number < 2) {
        return false;
    }
    for (auto i = 2u; i < number; i++) {
        if (number % i == 0) {
            return false;
        }
    }
    return true;
}

void touca::main(const std::string& testcase)
{
    const auto number = std::stoul(testcase);
    touca::add_result("is_prime", is_prime(number));
}
