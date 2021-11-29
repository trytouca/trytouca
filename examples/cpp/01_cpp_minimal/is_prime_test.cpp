// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "is_prime.hpp"

#include "touca/touca.hpp"

int main(int argc, char* argv[]) {
  touca::workflow("is_prime", [](const std::string& testcase) {
    const auto number = std::stoul(testcase);
    touca::check("output", is_prime(number));
  });
  touca::run(argc, argv);
}
