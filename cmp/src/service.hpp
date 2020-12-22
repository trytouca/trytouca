/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "boost/filesystem.hpp"
#include "boost/program_options.hpp"
#include "cxxopts.hpp"
#include "weasel/devkit/comparison.hpp"
#include "weasel/devkit/options.hpp"

namespace weasel {
    struct ComparisonJob;
}

/**
 *
 */
class ConfigOptions
{
public:
    /**
     *
     */
    enum class Value : unsigned char
    {
        api_url,
        log_dir,
        log_level,
        max_failures,
        max_retry_db_connect,
        project_dir,
        sleep_interval,
        startup_max_attempts,
        startup_attempt_interval,
        storage_dir
    };

    /**
     *
     */
    ConfigOptions();

    /**
     *
     */
    boost::program_options::options_description description() const;

    weasel::Options<Value> data;
};

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
    explicit Service(const ConfigOptions& opts);

    /**
     *
     */
    bool validate() const;

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
    weasel::Options<ConfigOptions::Value> _opts;
};
