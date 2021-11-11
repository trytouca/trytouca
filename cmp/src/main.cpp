// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include <thread>

#include "logger.hpp"
#include "options.hpp"
#include "startup.hpp"
#include "worker.hpp"

int main(int argc, char* argv[]) {
  Options options;

  // parse application options

  if (!parse_arguments(argc, argv, options)) {
    return EXIT_FAILURE;
  }

  // we are done if user has asked for help

  if (options.help.has_value()) {
    return EXIT_SUCCESS;
  }

  // initialize logger

  initialize_loggers(options);

  // setup communication with backend

  if (!run_startup_stage(options)) {
    touca::log_error("failed during start-up stage");
    return EXIT_FAILURE;
  }

  // initialize resources

  Resources resources;
  std::vector<std::thread> workers;

  // launch a thread dedicated to polling the platform for jobs and
  // populating the queue.

  workers.push_back(std::thread(collector, options, std::ref(resources)));

  // launch worker threads dedicated to taking jobs from the queue and
  // processing them.

  for (unsigned i = 0u; i < options.processor_threads; i++) {
    workers.push_back(std::thread(processor, options, std::ref(resources)));
  }

  // launch a separate thread to periodically generate a status report

  workers.push_back(std::thread(reporter, options, std::ref(resources)));

  // block the main thread to keep other threads continuously working

  std::for_each(workers.begin(), workers.end(), [](auto& t) { t.join(); });
  return EXIT_SUCCESS;
}
