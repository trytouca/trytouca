/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "service.hpp"
#include "comparator/logger.hpp"
#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "weasel/devkit/comparison.hpp"
#include "weasel/devkit/utils.hpp"
#include <thread>

/**
 *
 */
Service::Service(const Options& opts)
    : _opts(opts)
{
}

/**
 *
 */
bool Service::init()
{

    // setup logging

    weasel::setup_console_logger(_opts.arguments.log_level);
    if (_opts.arguments.log_dir.has_value())
    {
        weasel::setup_file_logger(_opts.arguments.log_dir.value().string());
    }

    // run startup stage

    if (!runStartupStage())
    {
        WEASEL_LOG_ERROR("failed during start-up stage");
        return false;
    }

    return true;
}

/**
 *
 */
bool Service::runStartupStage() const
{
    const auto max_attempts = _opts.arguments.startup_timeout / _opts.arguments.startup_interval;
    const auto& interval = std::chrono::milliseconds(_opts.arguments.startup_interval);
    WEASEL_LOG_INFO("running start-up stage");
    weasel::ApiUrl apiUrl(_opts.arguments.api_url);
    weasel::ApiConnector apiConnector(apiUrl);
    for (auto i = 1u; i <= max_attempts; ++i)
    {
        if (apiConnector.handshake())
        {
            WEASEL_LOG_INFO("start-up phase completed");
            return true;
        }
        WEASEL_LOG_WARN("running start-up stage: attempt ({}/{})", i, max_attempts);
        std::this_thread::sleep_for(interval);
    }
    return false;
}

/**
 *
 */
bool Service::run() const
{
    namespace chr = std::chrono;
    weasel::ApiUrl apiUrl(_opts.arguments.api_url);
    weasel::ApiConnector apiConnector(apiUrl);

    WEASEL_LOG_INFO("hello from weasel comparator");
    WEASEL_LOG_INFO("starting to run comparator in service mode");

    const auto& interval = chr::milliseconds(_opts.arguments.polling_interval);

    while (true)
    {
        const auto& jobs = apiConnector.getComparisonList();
        if (!jobs.empty() && !runTask(jobs))
        {
            WEASEL_LOG_WARN("failed to perform periodic operation");
            break;
        }
        if (jobs.empty())
        {
            std::this_thread::sleep_for(interval);
        }
    }

    return false;
}

/**
 * since the comparator is running as a service, we allow it to
 * fail to process one or multiple comparison jobs in hope that
 * it can re-process those jobs in a subsequent execution cycle.
 * at the same time, if the comparator fails to process multiple
 * consecutive jobs, it may be indicative of a serious problem,
 * in which case we gracefully abort the execution of this process
 * in order to prevent potential corruption of multiple jobs.
 */
bool Service::runTask(const std::vector<weasel::ComparisonJob>& jobs) const
{
    namespace chr = std::chrono;
    const auto& tic = chr::system_clock::now();
    WEASEL_LOG_INFO("processing {} comparison jobs", jobs.size());

    // find maximum number of consecutive failures of the comparator
    // that should trigger graceful termination of the process.

    const auto maxFailures = std::min(
        static_cast<unsigned>(jobs.size()),
        _opts.arguments.max_failures);

    // process comparison jobs one by one

    auto failureCount = 0u;
    for (const auto& job : jobs)
    {
        if (maxFailures < failureCount)
        {
            WEASEL_LOG_ERROR("exceeded maximum consecutive failures");
            return false;
        }
        if (!processJobAttempt(job))
        {
            WEASEL_LOG_ERROR("{}: failed to process comparison job", job.id);
            ++failureCount;
            continue;
        }
        failureCount = 0;
    }

    const auto& toc = chr::system_clock::now();
    const auto& dur = chr::duration_cast<chr::milliseconds>(toc - tic);
    WEASEL_LOG_INFO("processed {} comparison jobs: ({} ms)", jobs.size(), dur.count());
    WEASEL_LOG_INFO("average processing time: {:.2f} ms per job", _stats.avg);
    return true;
}

/**
 *
 */
bool Service::processJobAttempt(const weasel::ComparisonJob& job) const
{
    namespace chr = std::chrono;
    const auto& tic = chr::system_clock::now();
    WEASEL_LOG_DEBUG("{}: processing comparison job", job.id);

    const auto dst = loadResultFile(job.dstBatch, job.dstMessage);
    const auto src = loadResultFile(job.srcBatch, job.srcMessage);

    if (!src || !dst)
    {
        WEASEL_LOG_WARN("{}: comparison job is orphaned", job.id);
        return false;
    }

    const auto& dstName = src->metadata().describe();
    const auto& srcName = dst->metadata().describe();

    // ensure dst message is processed

    if (!job.dstProcessed && !processMessage(dst, job.dstMessage))
    {
        WEASEL_LOG_ERROR("{}: failed to process message", dstName);
        return false;
    }

    // ensure src message is processed

    if (job.dstMessage != job.srcMessage && !job.srcProcessed
        && !processMessage(src, job.srcMessage))
    {
        WEASEL_LOG_ERROR("{}: failed to process message", srcName);
        return false;
    }

    // now process the comparison job

    if (!processComparisonJob(dst, src, job.id))
    {
        WEASEL_LOG_ERROR("{}: failed to compare with {}", dstName, srcName);
        return false;
    }

    // log that comparison job was processed

    const auto& toc = chr::system_clock::now();
    const auto& dur = chr::duration_cast<chr::milliseconds>(toc - tic);
    WEASEL_LOG_INFO("{}: compared with {} ({} ms)", dstName, srcName, dur.count());
    _stats.update(dur.count());
    return true;
}

/**
 *
 */
std::shared_ptr<weasel::Testcase> Service::loadResultFile(
    const std::string& batchId,
    const std::string messageId) const
{
    const auto& fullpath = _opts.arguments.storage_dir / batchId / messageId;

    // check that the result file exists

    if (!std::filesystem::is_regular_file(fullpath))
    {
        WEASEL_LOG_ERROR("{}: result file is missing", fullpath.string());
        return nullptr;
    }

    // read binary data of stored result file and attempt to parse it
    // into a TestCase object.

    const auto binaryContent = weasel::load_string_file(fullpath.string());
    std::vector<uint8_t> buffer(binaryContent.begin(), binaryContent.end());
    try
    {
        return std::make_shared<weasel::Testcase>(buffer);
    }
    catch (const std::exception& ex)
    {
        WEASEL_LOG_ERROR("{}: failed to parse result: {}", fullpath.string(), ex.what());
        return nullptr;
    }
}

/**
 *
 */
bool Service::processMessage(
    const std::shared_ptr<weasel::Testcase>& result,
    const std::string& messageId) const
{
    const auto& desc = result->metadata().describe();
    WEASEL_LOG_DEBUG("{}: processing message", desc);

    // create json output to be posted to backend

    rapidjson::Document doc(rapidjson::kObjectType);
    rapidjson::Document::AllocatorType& allocator = doc.GetAllocator();

    doc.AddMember("overview", result->overview().json(allocator), allocator);
    doc.AddMember("body", result->json(allocator), allocator);

    rapidjson::StringBuffer strbuf;
    rapidjson::Writer<rapidjson::StringBuffer> writer(strbuf);
    writer.SetMaxDecimalPlaces(3);
    doc.Accept(writer);
    const auto output = strbuf.GetString();

    // submit output to Weasel Platform

    weasel::ApiUrl apiUrl(_opts.arguments.api_url);
    weasel::ApiConnector apiConnector(apiUrl);

    if (!apiConnector.processMessage(messageId, output))
    {
        WEASEL_LOG_WARN("{}: failed to submit message", desc);
        return false;
    }

    WEASEL_LOG_DEBUG("{}: processed message", desc);
    return true;
}

/**
 *
 */
bool Service::processComparisonJob(
    const std::shared_ptr<weasel::Testcase>& dst,
    const std::shared_ptr<weasel::Testcase>& src,
    const std::string& jobId) const
{
    const auto& dstName = dst->metadata().describe();
    const auto& srcName = src->metadata().describe();
    const auto& tuple = weasel::format("{}_{}", dstName, srcName);
    WEASEL_LOG_DEBUG("{}: processing comparison job", tuple);

    // perform comparison

    const auto& result = src->compare(dst);

    // create json output to be posted to backend

    rapidjson::Document doc(rapidjson::kObjectType);
    rapidjson::Document::AllocatorType& allocator = doc.GetAllocator();

    doc.AddMember("overview", result.overview().json(allocator), allocator);
    doc.AddMember("body", result.json(allocator), allocator);

    rapidjson::StringBuffer strbuf;
    rapidjson::Writer<rapidjson::StringBuffer> writer(strbuf);
    writer.SetMaxDecimalPlaces(3);
    doc.Accept(writer);
    const auto output = strbuf.GetString();

    // submit output to Weasel Platform

    weasel::ApiUrl apiUrl(_opts.arguments.api_url);
    weasel::ApiConnector apiConnector(apiUrl);

    if (!apiConnector.processComparison(jobId, output))
    {
        WEASEL_LOG_WARN("{}: failed to submit comparison job", tuple);
        return false;
    }

    WEASEL_LOG_DEBUG("{}: processed comparison job", tuple);
    return true;
}
