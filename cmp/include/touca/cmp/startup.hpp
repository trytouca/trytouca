// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "touca/cmp/options.hpp"

void initialize_loggers(const Options& options);

bool run_startup_stage(const Options& options);
