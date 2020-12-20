/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "weasel/lib_api.hpp"
#include <string>

namespace weasel {

    /**
     * @brief a simple class that helps clients log the duration between
     *        its instantiation and destruction as a performance metric.
     *
     * @see weasel::make_timer
     */
    class WEASEL_CLIENT_API scoped_timer
    {
    public:
        /**
         *
         */
        explicit scoped_timer(const std::string& name);

        /**
         *
         */
        ~scoped_timer();

    private:
        std::string _name;
    };

} // namespace weasel
