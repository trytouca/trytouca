/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "worker.hpp"
#include "weasel/devkit/logger.hpp"
#include <thread>

/**
 *
 */
void collector(const Options& options, Resources& resources)
{
    namespace chr = std::chrono;
    const auto& interval = chr::milliseconds(options.polling_interval);

    while (true) {
        WEASEL_LOG_DEBUG("polling for new comparison jobs");
        const auto& tic = chr::system_clock::now();
        auto jobs = retrieveJobs(options.api_url);

        // if there is no job, we have nothing to do but wait

        if (jobs.empty()) {
            std::this_thread::sleep_for(interval);
            continue;
        }

        // update statistics

        WEASEL_LOG_INFO("received {} comparison jobs", jobs.size());
        const auto& toc = chr::system_clock::now();
        const auto& dur = chr::duration_cast<chr::milliseconds>(toc - tic);
        resources.stats.update_collector_stats(dur.count(), jobs.size());

        // push jobs into queue for async processing

        for (auto& job : jobs) {
            resources.job_queue.push_item(std::move(job));
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
    std::string previous = "";
    while (true) {
        std::this_thread::sleep_for(interval);
        const auto& report = resources.stats.report();
        if (report.compare(previous)) {
            WEASEL_LOG_INFO("{}", report);
            previous = report;
        }
    }
}

/**
 *
 */
void processor(const Options& options, Resources& resources)
{
    namespace chr = std::chrono;
    while (true) {
        const auto job = resources.job_queue.pop_item();
        const auto desc = job->desc();
        WEASEL_LOG_DEBUG("{}: processing", desc);
        const auto& tic = chr::system_clock::now();

        if (!job->process(options)) {
            WEASEL_LOG_ERROR("{}: failed to process job", desc);
            continue;
        }

        // log that comparison job was processed

        const auto& toc = chr::system_clock::now();
        const auto& dur = chr::duration_cast<chr::milliseconds>(toc - tic);
        WEASEL_LOG_INFO("{}: processed ({} ms)", desc, dur.count());
        resources.stats.update_processor_stats(dur.count());
    }
}
