/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "options.hpp"
#include "stats.hpp"

namespace weasel {
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
