/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "options.hpp"
#include <memory>
#include <string>
#include <vector>

/**
 *
 */
struct Job
{
    virtual bool process(const Options& options) const = 0;
    virtual std::string desc() const = 0;
    virtual ~Job() = default;
};

/**
 *
 */
struct MessageJob : public Job
{
    /**
     *
     */
    MessageJob(const std::string& batchId, const std::string& messageId);

    /**
     *
     */
    bool process(const Options& options) const override;

    /**
     *
     */
    std::string desc() const override;
private:
    std::string _batchId;
    std::string _messageId;
};

/**
 *
 */
struct ComparisonJob : public Job
{
    std::string _jobId;
    std::string _dstBatchId;
    std::string _dstMessageId;
    std::string _srcBatchId;
    std::string _srcMessageId;

    /**
     *
     */
    ComparisonJob(
        const std::string& jobId,
        const std::string& dstBatchId,
        const std::string& dstMessageId,
        const std::string& srcBatchId,
        const std::string& srcMessageId)
        : Job(), _jobId(jobId), _dstBatchId(dstBatchId), _dstMessageId(dstMessageId),
        _srcBatchId(srcBatchId), _srcMessageId(srcMessageId)
    {
    }

    /**
     *
     */
    bool process(const Options& options) const override;

    /**
     *
     */
    std::string desc() const override;
};

/**
 *
 */
std::vector<std::unique_ptr<Job>> retrieveJobs(const std::string& api_url);
