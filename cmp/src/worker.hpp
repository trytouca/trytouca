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

/**
 *
 */
class Service
{
public:
    /**
     *
     */
    explicit Service(const Options& opts);

    /**
     *
     */
    bool process(const weasel::ComparisonJob& task) const;

private:
    /**
     *
     */
    std::shared_ptr<weasel::Testcase> loadResultFile(
        const std::string& batchId,
        const std::string messageId) const;

    /**
     *
     */
    bool processMessage(
        const std::shared_ptr<weasel::Testcase>& result,
        const std::string& messageId) const;

    /**
     *
     */
    bool processComparisonJob(
        const std::shared_ptr<weasel::Testcase>& dst,
        const std::shared_ptr<weasel::Testcase>& src,
        const std::string& jobId) const;

    Options _opts;
};
