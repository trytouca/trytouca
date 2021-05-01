/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "platform.hpp"
#include "object_store.hpp"
#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "weasel/devkit/comparison.hpp"
#include "weasel/devkit/logger.hpp"
#include "weasel/devkit/platform.hpp"
#include "weasel/devkit/utils.hpp"

/**
 *
 */
MessageJob::MessageJob(const std::string& batchId, const std::string& messageId)
    : Job()
    , _batchId(batchId)
    , _messageId(messageId)
{
}

/**
 *
 */
std::string MessageJob::desc() const
{
    return weasel::format("m:{}", _messageId);
}

/**
 *
 */
bool MessageJob::process(const Options& options) const
{
    const auto& store = ObjectStore::get_instance(options);
    const auto result = store.get_message(_messageId);
    if (!result) {
        WEASEL_LOG_WARN("{}: failed to process message", desc());
        return false;
    }

    const auto& name = result->metadata().describe();

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

    weasel::ApiUrl api(options.api_url);
    weasel::Platform platform(api);

    const auto url = weasel::format("/cmp/message/{}", _messageId);
    if (!platform.cmp_submit(url, output)) {
        WEASEL_LOG_WARN("{}: failed to submit message: {}", name, platform.get_error());
        return false;
    }

    return true;
}

/**
 *
 */
std::string ComparisonJob::desc() const
{
    return weasel::format("c:{}", _jobId);
}

/**
 *
 */
bool ComparisonJob::process(const Options& options) const
{
    const auto& store = ObjectStore::get_instance(options);
    const auto dst = store.get_message(_dstMessageId);
    const auto src = store.get_message(_srcMessageId);

    if (!src || !dst) {
        WEASEL_LOG_WARN("{}: comparison job is orphaned", desc());
        return false;
    }

    const auto& dstName = src->metadata().describe();
    const auto& srcName = dst->metadata().describe();
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

    weasel::ApiUrl api(options.api_url);
    weasel::Platform platform(api);

    const auto url = weasel::format("/cmp/job/{}", _jobId);
    if (!platform.cmp_submit(url, output)) {
        WEASEL_LOG_WARN("{}: failed to submit comparison result: {}", tuple, platform.get_error());
        return false;
    }

    return true;
}

/**
 *
 */
std::vector<std::unique_ptr<Job>> retrieveJobs(const std::string& api_url)
{
    weasel::ApiUrl api(api_url);
    weasel::Platform platform(api);

    std::string body;
    if (!platform.cmp_jobs(body)) {
        WEASEL_LOG_ERROR("failed to obtain list of jobs: {}", platform.get_error());
        return {};
    }

    rapidjson::Document doc;
    if (doc.Parse<0>(body.c_str()).HasParseError()) {
        WEASEL_LOG_ERROR("backend response for list of jobs is ill-formed");
        return {};
    }

    if (!doc.HasMember("messages") || !doc["messages"].IsArray()) {
        WEASEL_LOG_ERROR("backend response has no field `messages`");
        return {};
    }

    if (!doc.HasMember("comparisons") || !doc["comparisons"].IsArray()) {
        WEASEL_LOG_ERROR("backend response has no field `comparisons`");
        return {};
    }

    std::vector<std::unique_ptr<Job>> jobs;

    for (const auto& item : doc["messages"].GetArray()) {
        jobs.push_back(std::make_unique<MessageJob>(
            item["batchId"].GetString(),
            item["messageId"].GetString()));
    }

    for (const auto& item : doc["comparisons"].GetArray()) {
        jobs.push_back(std::make_unique<ComparisonJob>(
            item["jobId"].GetString(),
            item["dstBatchId"].GetString(),
            item["dstMessageId"].GetString(),
            item["srcBatchId"].GetString(),
            item["srcMessageId"].GetString()));
    }

    return jobs;
}
