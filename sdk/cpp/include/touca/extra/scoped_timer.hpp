// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "touca/lib_api.hpp"
#include "touca/touca.hpp"
#include <string>

#ifndef DOXYGEN_SHOULD_SKIP_THIS
#if (__cplusplus >= 201703L)
#define MAYBE_UNUSED [[maybe_unused]]
#else
#define MAYBE_UNUSED
#endif
#endif

/**
 * @def TOUCA_SCOPED_TIMER
 * @brief convenience macro for logging performance of a function
 *        as a performance metric.
 * @see touca::make_timer()
 *      for more information about adding performance metrics.
 */
#define TOUCA_SCOPED_TIMER                                                         \
    MAYBE_UNUSED const auto& touca_scoped_timer = touca::make_timer(__FUNCTION__); \
    std::ignore = touca_scoped_timer;

namespace touca {

    /**
     * @brief a simple class that helps clients log the duration between
     *        its instantiation and destruction as a performance metric.
     *
     * @see touca::make_timer
     */
    class TOUCA_CLIENT_API scoped_timer {
    public:
        /**
         *
         */
        explicit inline scoped_timer(const std::string& name)
            : _name(name)
        {
            start_timer(_name);
        }

        /**
         *
         */
        inline ~scoped_timer()
        {
            stop_timer(_name);
        }

    private:
        std::string _name;
    };

    /**
     * @param key name to be associated with the performance metric
     *
     * @return a scoped timer object that notifies this client instance
     *         both when it is instantiated and when it goes out of scope;
     *         logging the duration between the two events as a performance
     *         metric.
     */
    TOUCA_CLIENT_API inline touca::scoped_timer make_timer(const std::string& key)
    {
        return scoped_timer(key);
    }

} // namespace touca
