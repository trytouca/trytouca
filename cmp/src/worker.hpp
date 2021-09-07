// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "options.hpp"
#include "stats.hpp"

namespace touca {
    struct ComparisonJob;
    struct Testcase;
}

/**
 *
 */
void collector(const Options& options, Resources& resources);

/**
 *
 */
void reporter(const Options& options, Resources& resources);

/**
 *
 */
void processor(const Options& options, Resources& resources);
