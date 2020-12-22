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
    bool has_argument_help = false;

private:
    std::unordered_map<std::string, std::string> _options;
};
