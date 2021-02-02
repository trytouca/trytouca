/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include <condition_variable>
#include <mutex>
#include <queue>

/**
 * @file queue.hpp
 *
 * @brief Provides a generic thread-safe queue for sharing tasks between
 *        producer and consumer threads.
 *
 * @author Pejman Ghorbanzade <pejman@ghorbanzade.com>
 * @date 2020
 */

namespace weasel {

    /**
     * @brief Generic thread-safe queue.
     *
     * @details Intended for sharing tasks between producer and consumer threads.
     *
     * @tparam Type of items to be inserted and later fetched from the queue.
     */
    template <typename Task>
    class Queue {
        std::mutex _mutex;
        std::condition_variable _cv;
        std::queue<std::unique_ptr<Task>> _queue;

    public:
        /**
         * @brief Attempts to safely add an object to the queue.
         *
         * @details Intended to be used by threads that produce events for later
         *          consumption by other consumers threads.
         *
         * @param item object to be inserted into the queue.
         */
        void push_item(std::unique_ptr<Task> item)
        {
            std::lock_guard<std::mutex> lock(_mutex);
            _queue.push(std::move(item));
            _cv.notify_one();
        }

        /**
         * @brief Attempts to safely remove an object from the queue.
         *
         * @details Intended for use by consumer threads.
         *
         * @return object obtained from the queue.
         */
        std::unique_ptr<Task> pop_item()
        {
            std::unique_lock<std::mutex> lock(_mutex);
            _cv.wait(lock, [&]{ return !_queue.empty(); });
            auto item = std::move(_queue.front());
            _queue.pop();
            return item;
        }
    };

} // namespace weasel
