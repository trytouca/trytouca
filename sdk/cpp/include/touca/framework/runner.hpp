// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <functional>
#include <string>

#include "touca/lib_api.hpp"

namespace touca {

TOUCA_CLIENT_API void workflow(
    const std::string& name,
    const std::function<void(const std::string&)> workflow);

TOUCA_CLIENT_API void run(int argc, char* argv[]);

}  // namespace touca
