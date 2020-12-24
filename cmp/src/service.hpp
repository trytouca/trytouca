/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "comparator/options.hpp"
#include "weasel/devkit/platform.hpp"
#include "weasel/devkit/testcase.hpp"

namespace weasel {
    struct ComparisonJob;
}

/**
 *
 */
struct Statistics
{
    unsigned long count = 0ul;
    double avg = 0.0;

    /**
     *
     */
    void update(long long duration)
    {
        avg = (avg * count + duration) / (count + 1);
        count++;
    }
};

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
    bool init();

    /**
     *
     */
    bool run() const;

private:
    /**
     *
     */
    bool runStartupStage() const;

    /**
     *
     */
    bool runTask(const std::vector<weasel::ComparisonJob>& jobs) const;

    /**
     *
     */
    bool processJobAttempt(const weasel::ComparisonJob& task) const;

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

    mutable Statistics _stats;
    Options _opts;
};
