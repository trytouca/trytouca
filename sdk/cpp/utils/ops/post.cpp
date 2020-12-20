/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "boost/filesystem.hpp"
#include "utils/misc/file.hpp"
#include "utils/operations.hpp"
#include "weasel/devkit/extra/logger.hpp"
#include "weasel/devkit/platform.hpp"
#include "weasel/devkit/resultfile.hpp"
#include <iostream>
#include <unordered_map>

/**
 *
 */
PostOperation::PostOperation()
    : Operation()
{
}

/**
 *
 */
boost::program_options::options_description PostOperation::description() const
{
    namespace po = boost::program_options;
    // clang-format off
    po::options_description desc{ "Options --mode=post" };
    desc.add_options()
        ("src", po::value<std::string>(),
        "path to weasel result file to be submitted to the weasel platform. "
        "if the specified path points to a directory, it will be searched "
        "recursively for weasel result files to post to the platform")
        ("api-key", po::value<std::string>(),
        "API Key to authenticate to Weasel Platform.")
        ("api-url", po::value<std::string>(),
        "URL to Weasel Platform API. "
        "Example: https://getweasel.com/api/@/hogwartz/quiddich-vr/1.0")
        ("fail-fast", po::value<std::string>()->default_value("true"),
        "abort operation as soon as we encounter error during submission of "
        "a result file");
    // clang-format on
    return desc;
}

/**
 *
 */
void PostOperation::parse_options(
    const boost::program_options::variables_map vm)
{
    Operation::parse_basic_options(
        vm, { "src", "api-key", "api-url", "fail-fast" });

    // if API key is not provided as a command line argument, check if it
    // is specified as an environment variable.

    if (!_opts.has("api-key"))
    {
        const auto apiKey = std::getenv("WEASEL_API_KEY");
        if (apiKey != nullptr)
        {
            _opts.add("api-key", std::string(apiKey));
        }
    }
}

/**
 *
 */
bool PostOperation::validate_options() const
{
    // check that all required keys exist

    if (!validate_required_keys({ "src", "api-key", "api-url", "fail-fast" }))
    {
        return false;
    }

    // check that the specifed path exists

    if (!boost::filesystem::exists(_opts.get("src")))
    {
        std::cerr << "provided path to result file(s) is invalid" << std::endl;
        return false;
    }

    // we used to validate that the given directory has at least one
    // weasel result file. However, since finding weasel result files
    // is an expensive operation, we choose to defer this check to
    // operation run-time.

    return true;
}

/**
 *
 */
bool PostOperation::run() const
{
    WEASEL_LOG_INFO("starting execution of operation: post");

    // authenticate to Weasel Platform

    weasel::ApiUrl apiUrl(_opts.get("api-url"));
    const auto& apiToken = weasel::ApiConnector(apiUrl).authenticate(_opts.get("api-key"));
    if (apiToken.empty())
    {
        std::cerr << "failed to authenticate to Weasel Platform" << std::endl;
        return false;
    }

    // we allow user to specify a single file or a directory as the path
    // the result file(s). If a directory is specified, we recursively
    // iterate over all the file system elements in that directory and
    // identify weasel result files.

    std::vector<weasel::path> resultFiles;
    findResultFiles(_opts.get("src"), std::back_inserter(resultFiles));

    // we are done if there are no weasel result files in the given directory

    if (resultFiles.empty())
    {
        const auto msg = "failed to find any valid result file";
        std::cerr << msg << std::endl;
        WEASEL_LOG_ERROR(msg);
        return false;
    }

    WEASEL_LOG_DEBUG("found {} weasel result file", resultFiles.size());

    using err_t = std::unordered_map<std::string, std::vector<std::string>>;
    const auto print = [](const err_t& errors) {
        for (const auto& src : errors)
        {
            std::cerr << src.first << ":" << '\n';
            for (const auto& err : src.second)
            {
                std::cerr << " - " << err << std::endl;
            }
        }
    };

    // post the identified result files one by one to the weasel platform.
    // by default we choose to abort as soon as we fail to post one of the
    // specified result files.

    err_t errors;
    weasel::ApiConnector apiConnector(apiUrl, apiToken);
    for (const auto& src : resultFiles)
    {
        std::vector<std::string> errs;
        try
        {
            const auto& content = weasel::load_string_file(src, std::ios::binary);
            errs = apiConnector.submitResults(content, 5u);
        }
        catch (const std::exception& ex)
        {
            errs.emplace_back(weasel::format("exception: {}", ex.what()));
        }
        if (errs.empty())
        {
            WEASEL_LOG_INFO("submitted {}", src);
            continue;
        }

        errors.emplace(src, errs);
        WEASEL_LOG_WARN("failed to submit {}: {}", src, errs.front());

        if (0 == _opts.get("fail-fast").compare("true"))
        {
            WEASEL_LOG_INFO("aborting due to fail-fast policy");
            print(errors);
            return false;
        }
    }

    if (errors.empty())
    {
        WEASEL_LOG_INFO(
            "successfully submitted all {} result files", resultFiles.size());
        return true;
    }

    WEASEL_LOG_ERROR("failed to submit {} result files", errors.size());
    print(errors);
    return false;
}
