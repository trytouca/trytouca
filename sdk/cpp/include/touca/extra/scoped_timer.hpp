// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "touca/lib_api.hpp"
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
 */
#define TOUCA_SCOPED_TIMER                                                   \
    MAYBE_UNUSED const touca::scoped_timer touca_scoped_timer(__FUNCTION__); \
    std::ignore = touca_scoped_timer;

namespace touca {

    void start_timer(const std::string& name);
    void stop_timer(const std::string& name);

    /**
     * @brief a simple class that helps clients log the duration between
     *        its instantiation and destruction as a performance metric.
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

} // namespace touca
