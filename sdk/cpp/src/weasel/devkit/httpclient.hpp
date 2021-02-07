/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "httplib.h"
#include "weasel/devkit/platform.hpp"

namespace weasel {

    using Cli = std::unique_ptr<httplib::Client>;

    /**
     *
     */
    class Http : public Transport {
    public:
        explicit Http(const std::string& root);
        void set_token(const std::string& token);
        Response get(const std::string& route) const;
        Response patch(const std::string& route, const std::string& body = "") const;
        Response post(const std::string& route, const std::string& body = "") const;
        Response binary(const std::string& route, const std::string& content) const;

    private:
        Cli _cli;
    };

} // namespace weasel
