/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#if 201703L <= __cplusplus
#include <filesystem>
namespace weasel {
    using path = std::string;
    namespace filesystem = std::filesystem;
}
#elif defined(_WIN32)
#include "boost/filesystem.hpp"
namespace weasel {
    using path = std::string;
    namespace filesystem = boost::filesystem;
}
#else
#include "boost/filesystem.hpp" // temporary
#include <fstream>
#include <ios>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>
namespace weasel {
    using path = std::string;
}
namespace weasel { namespace filesystem {

    /**
     *
     */
    inline bool is_regular_file(const std::string& path)
    {
        struct stat sb;
        return stat(path.c_str(), &sb) == 0 && S_ISREG(sb.st_mode);
    }

    /**
     *
     */
    inline bool is_directory(const std::string& path)
    {
        struct stat sb;
        return stat(path.c_str(), &sb) == 0 && S_ISDIR(sb.st_mode);
    }

    /**
     * @brief checks if a given path corresponds to an existing file or
     *        directory.
     *
     * @param path filesystem path to file or directory to be checked.
     * @return true if the given path or file status corresponds to an
     *         existing file or directory.
     */
    inline bool exists(const std::string& path)
    {
        std::ifstream file(path);
        return file.good();
    }

}} // namespace weasel::filesystem
#endif
