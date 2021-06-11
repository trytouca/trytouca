// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "touca/framework.hpp"

namespace touca { namespace framework {

    /**
     * @brief Provides testcases that were used in the baseline version of
     *        this workflow.
     *
     * @details Queries the Touca server to obtain the list of testcases
     *          that are part of the current baseline version of the workflow
     *          under test.
     *
     * @since v1.2.0
     */
    class TOUCA_FRAMEWORK_API RemoteSuite final : public Suite {
    public:
        RemoteSuite(const Options& options);

        void initialize() override;

    private:
        Options _options;
    };

    /**
     * @brief Provides entries in each line of a given file as the set of
     *        testcases to be used in this workflow.
     *
     * @details Skips empty lines and any line starting with two consecutive
     *          `#` characeters.
     *
     * @since v1.2.0
     */
    class TOUCA_FRAMEWORK_API FileSuite final : public Suite {
    public:
        FileSuite(const std::string& path);

        void initialize() override;

    private:
        std::string _path;
    };

}} // namespace touca::framework
