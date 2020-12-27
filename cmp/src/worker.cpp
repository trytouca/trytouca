/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "worker.hpp"
#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "weasel/devkit/comparison.hpp"
#include "weasel/devkit/logger.hpp"
#include "weasel/devkit/platform.hpp"
#include "weasel/devkit/utils.hpp"
#include <thread>

/**
 *
 */
void collector(const Options& options, Resources& resources)
{
    namespace chr = std::chrono;
    weasel::ApiUrl apiUrl(options.api_url);
    weasel::ApiConnector apiConnector(apiUrl);
    const auto& interval = chr::milliseconds(options.polling_interval);

    while (true)
    {
        WEASEL_LOG_DEBUG("polling for new comparison jobs");
        const auto& tic = chr::system_clock::now();
        const auto& jobs = apiConnector.getComparisonList();

        // if there is no job, we have nothing to do but wait

        if (jobs.empty())
        {
            std::this_thread::sleep_for(interval);
            continue;
        }

        // update statistics

        WEASEL_LOG_INFO("received {} comparison jobs", jobs.size());
        const auto& toc = chr::system_clock::now();
        const auto& dur = chr::duration_cast<chr::milliseconds>(toc - tic);
        resources.stats.update_collector_stats(dur.count(), jobs.size());

        // push jobs into queue for async processing

        for (const auto& job : jobs)
        {
            auto job_ptr = std::make_unique<weasel::ComparisonJob>(job);
            resources.job_queue.push_item(std::move(job_ptr));
        }
    }
}

/**
 *
 */
void reporter(const Options& options, Resources& resources)
{
    namespace chr = std::chrono;
    const auto& interval = chr::milliseconds(options.status_report_interval);
    while (true)
    {
        std::this_thread::sleep_for(interval);
        const auto& report = resources.stats.report();
        WEASEL_LOG_INFO("{}", report);
    }
}

/**
 *
 */
void processor(const Options& options, Resources& resources)
{
    namespace chr = std::chrono;
    while (true)
    {
        const auto job = resources.job_queue.pop_item();
        const auto& tic = chr::system_clock::now();

        Service service(options);
        if (!service.process(*job))
        {
            WEASEL_LOG_WARN("failed to process job {}", job->id);
            continue;
        }

        // log that comparison job was processed

        const auto& toc = chr::system_clock::now();
        const auto& dur = chr::duration_cast<chr::milliseconds>(toc - tic);
        resources.stats.update_processor_stats(dur.count());
    }
}

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
bool Service::process(const weasel::ComparisonJob& job) const
{
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

    WEASEL_LOG_INFO("{}: compared with {}", dstName, srcName);
    return true;
}

/**
 *
 */
std::shared_ptr<weasel::Testcase> Service::loadResultFile(
    const std::string& batchId,
    const std::string messageId) const
{
    const auto& fullpath = _opts.storage_dir / batchId / messageId;

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

    weasel::ApiUrl apiUrl(_opts.api_url);
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

    weasel::ApiUrl apiUrl(_opts.api_url);
    weasel::ApiConnector apiConnector(apiUrl);

    if (!apiConnector.processComparison(jobId, output))
    {
        WEASEL_LOG_WARN("{}: failed to submit comparison job", tuple);
        return false;
    }

    WEASEL_LOG_DEBUG("{}: processed comparison job", tuple);
    return true;
}
