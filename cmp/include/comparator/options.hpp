/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include <string>
#include <unordered_map>

/**
 *
 */
struct Options
{
    bool parse(int argc, char* argv[]);

    std::unordered_map<std::string, std::string> data;
};
