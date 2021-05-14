/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "touca/lib_api.hpp"
#include <string>

namespace touca {

    /**
     * @see touca::add_logger
     * @since v1.1
     */
    class TOUCA_CLIENT_API logger {
    public:
        enum class Level {
            Debug,
            Info,
            Warning,
            Error
        };
        virtual void log(const Level level, const std::string msg) const = 0;
    };

} // namespace touca
