/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "platform.hpp"
#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "weasel/devkit/comparison.hpp"
#include "weasel/devkit/logger.hpp"
#include "weasel/devkit/platform.hpp"
#include "weasel/devkit/utils.hpp"

/**
 *
 */
std::shared_ptr<weasel::Testcase> loadResultFile(const std::filesystem::path& path)
{
    // check that the result file exists

    if (!std::filesystem::is_regular_file(path))
    {
        WEASEL_LOG_ERROR("{}: result file is missing", path.string());
        return nullptr;
    }

    // read binary data of stored result file and attempt to parse it
    // into a TestCase object.

    const auto binaryContent = weasel::load_string_file(path.string());
    std::vector<uint8_t> buffer(binaryContent.begin(), binaryContent.end());
    try
    {
        return std::make_shared<weasel::Testcase>(buffer);
    }
    catch (const std::exception& ex)
    {
        WEASEL_LOG_WARN("{}: failed to parse result: {}", path.string(), ex.what());
        return nullptr;
    }
}

/**
 *
 */
MessageJob::MessageJob(const std::string& batchId, const std::string& messageId)
    : Job(), _batchId(batchId), _messageId(messageId)
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
    const auto result = loadResultFile(options.storage_dir / _batchId / _messageId);
    if (!result)
    {
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

    weasel::ApiUrl apiUrl(options.api_url);
    weasel::ApiConnector apiConnector(apiUrl);
    const auto url = weasel::format("/cmp/message/{}", _messageId);

    // @todo check that response code is 204

    if (!apiConnector.patchJson(url, output))
    {
        WEASEL_LOG_WARN("{}: failed to submit message", name);
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
    const auto dst = loadResultFile(options.storage_dir / _dstBatchId / _dstMessageId);
    const auto src = loadResultFile(options.storage_dir / _srcBatchId / _srcMessageId);

    if (!src || !dst)
    {
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

    weasel::ApiUrl apiUrl(options.api_url);
    weasel::ApiConnector apiConnector(apiUrl);
    const auto url = weasel::format("/cmp/job/{}", _jobId);

    // @todo check that response code is 204

    if (!apiConnector.patchJson(url, output))
    {
        WEASEL_LOG_WARN("{}: failed to submit comparison result", tuple);
        return false;
    }

    return true;
}

/**
 * @todo getJson check that response code != -1
 * @todo getJson check that response code == 200
 */
std::vector<std::unique_ptr<Job>> retrieveJobs(const std::string& api_url)
{
    weasel::ApiUrl apiUrl(api_url);
    weasel::ApiConnector apiConnector(apiUrl);
    rapidjson::Document doc;

    const auto body = apiConnector.getJson("/cmp");

    if (doc.Parse<0>(body.c_str()).HasParseError())
    {
        WEASEL_LOG_ERROR("backend response for list of jobs is ill-formed");
        return {};
    }

    if (!doc.HasMember("messages") || !doc["messages"].IsArray())
    {
        WEASEL_LOG_ERROR("backend response has no field `messages`");
        return {};
    }

    if (!doc.HasMember("comparisons") || !doc["comparisons"].IsArray())
    {
        WEASEL_LOG_ERROR("backend response has no field `comparisons`");
        return {};
    }

    std::vector<std::unique_ptr<Job>> jobs;

    for (const auto& item : doc["messages"].GetArray())
    {
        jobs.push_back(std::make_unique<MessageJob>(
            item["batchId"].GetString(),
            item["messageId"].GetString()
        ));
    }

    for (const auto& item : doc["comparisons"].GetArray())
    {
        jobs.push_back(std::make_unique<ComparisonJob>(
            item["jobId"].GetString(),
            item["dstBatchId"].GetString(),
            item["dstMessageId"].GetString(),
            item["srcBatchId"].GetString(),
            item["srcMessageId"].GetString()
        ));
    }

    return jobs;
}
