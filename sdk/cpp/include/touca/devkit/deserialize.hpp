// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <memory>
#include <vector>

#include "touca/lib_api.hpp"

namespace touca {
class IType;
class Testcase;
namespace fbs {
struct TypeWrapper;
}  // namespace fbs

std::shared_ptr<IType> TOUCA_CLIENT_API
deserialize_value(const fbs::TypeWrapper* ptr);

Testcase TOUCA_CLIENT_API
deserialize_testcase(const std::vector<uint8_t>& buffer);

}  // namespace touca
