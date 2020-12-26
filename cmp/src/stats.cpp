/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "stats.hpp"
#include "weasel/devkit/utils.hpp"

/**
 *
 */
void Statistics::update_collector_stats(long long duration, unsigned long jobs)
{
    std::scoped_lock lock(_mutex);
    const auto count = counter_collect;
    avg_size_collect = (avg_size_collect * count + jobs) / (count + 1);
    avg_time_collect = (avg_time_collect * count + duration) / (count + 1);
    job_count_collect += jobs;
    counter_collect++;
}

/**
 *
 */
void Statistics::update_processor_stats(long long duration)
{
    std::scoped_lock lock(_mutex);
    const auto count = counter_process;
    avg_time_process = (avg_time_process * count + duration) / (count + 1);
    job_count_process++;
    counter_process++;
}

/**
 *
 */
std::string Statistics::report()
{
    std::scoped_lock lock(_mutex);
    auto collect = weasel::format("{{\"count\":{},\"avg_time\":{:.2f},\"avg_size\":{:.2f}}}", job_count_collect, avg_time_collect, avg_size_collect);
    auto process = weasel::format("{{\"count\":{},\"avg_time\":{:.2f}}}", job_count_process, avg_time_process);
    return weasel::format("{{\"collect\":{},\"process\":{}}}", collect, process);
}
