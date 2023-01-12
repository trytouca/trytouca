// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <cstdint>
#include <vector>

#include "touca/cli_lib_api.hpp"

namespace touca {
class data_point;
class Testcase;
  namespace fbs {
struct TypeWrapper;
}  // namespace fbs

data_point TOUCA_CLI_API deserialize_value(const fbs::TypeWrapper* ptr);

Testcase TOUCA_CLI_API
deserialize_testcase(const std::vector<std::uint8_t>& buffer);

}  // namespace touca
