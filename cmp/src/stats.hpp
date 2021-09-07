// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "platform.hpp"
#include "queue.hpp"
#include <string>

/**
 *
 */
struct Statistics {
    unsigned long job_count_collect = 0ul;
    unsigned long job_count_process = 0ul;
    double avg_time_collect = 0.0;
    double avg_time_process = 0.0;

    void update_collector_stats(long long duration, unsigned long jobs);
    void update_processor_stats(long long duration);
    std::string report();
    void reset();

private:
    unsigned long counter_collect = 0ul;
    unsigned long counter_process = 0ul;
    std::mutex _mutex;
};

/**
 *
 */
struct Resources {
    touca::Queue<Job> job_queue;
    Statistics stats;
};
