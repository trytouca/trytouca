// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <cstdint>
#include <vector>

#include "touca/cli_lib_api.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/core/testcase.hpp"

namespace touca {
class data_point;
namespace fbs {
struct TypeWrapper;
}  // namespace fbs

data_point TOUCA_CLI_API deserialize_value(const fbs::TypeWrapper* ptr);

Testcase TOUCA_CLI_API
deserialize_testcase(const std::vector<std::uint8_t>& buffer);

ElementsMap TOUCA_CLI_API deserialize_file(const touca::filesystem::path& path);

}  // namespace touca
