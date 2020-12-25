/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "cxxopts.hpp"
#include "utils/misc/file.hpp"
#include "utils/operations.hpp"
#include "weasel/devkit/logger.hpp"
#include "weasel/devkit/platform.hpp"

/**
 * we used to validate that the given directory has at least one
 * weasel result file. However, since finding weasel result files
 * is an expensive operation, we choose to defer this check to
 * operation run-time.
 */
bool PostOperation::parse_impl(int argc, char* argv[])
{
    cxxopts::Options options("weasel-cmp --mode=pos");
    // clang-format off
    options.add_options("main")
        ("src", "file or directory to be posted", cxxopts::value<std::string>())
        ("api-key", "API Key to authenticate to Weasel Platform", cxxopts::value<std::string>())
        ("api-url", "URL to Weasel Platform API", cxxopts::value<std::string>())
        ("fail-fast", "abort as soon as we encounter an error ", cxxopts::value<bool>()->default_value("true"));
    // clang-format on
    options.allow_unrecognised_options();

    const auto& result = options.parse(argc, argv);

    if (!result.count("src"))
    {
        weasel::print_error("file or directory not provided\n");
        fmt::print(stdout, "{}\n", options.help());
        return false;
    }

    _src = result["src"].as<std::string>();

    if (!weasel::filesystem::exists(_src))
    {
        weasel::print_error("file `{}` does not exist\n", _src);
        return false;
    }

    if (!result.count("api-url"))
    {
        weasel::print_error("api-url not provided\n");
        fmt::print(stdout, "{}\n", options.help());
        return false;
    }

    _api_url = result["api-url"].as<std::string>();

    if (!result.count("api-key"))
    {
        const auto env_value = std::getenv("WEASEL_API_KEY");
        if (env_value == nullptr)
        {
            weasel::print_error("api-key not provided as argument or env variable\n");
            fmt::print(stdout, "{}\n", options.help());
            return false;
        }
        _api_key = std::string(env_value);
    }
    else
    {
        _api_key = result["api-key"].as<std::string>();
    }

    _fail_fast = result["fail-fast"].as<bool>();

    return true;
}

/**
 *
 */
bool PostOperation::run_impl() const
{
    WEASEL_LOG_INFO("starting execution of operation: post");

    // authenticate to Weasel Platform

    weasel::ApiUrl apiUrl(_api_url);
    const auto& apiToken = weasel::ApiConnector(apiUrl).authenticate(_api_key);
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
    findResultFiles(_src, std::back_inserter(resultFiles));

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

        if (_fail_fast)
        {
            WEASEL_LOG_INFO("aborting due to fail-fast policy");
            print(errors);
            return false;
        }
    }

    if (errors.empty())
    {
        WEASEL_LOG_INFO("successfully submitted all {} result files", resultFiles.size());
        return true;
    }

    WEASEL_LOG_ERROR("failed to submit {} result files", errors.size());
    print(errors);
    return false;
}
