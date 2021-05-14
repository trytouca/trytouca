/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

/**
 * @file resultfile.hpp
 *
 * @brief declares class touca::ResultFile which provides utility
 *        functions for creating and interacting with test result
 *        files.
 */

#include "touca/devkit/comparison.hpp"
#include "touca/devkit/filesystem.hpp"

namespace touca {

    /**
     * @brief provides means for interacting with test result files.
     *
     * @author Pejman Ghorbanzade
     */
    class TOUCA_CLIENT_API ResultFile {
    public:
        /**
         * @brief represents value returned by function `Resultfile::compare`.
         *
         * @param fresh testcases missing from object compared with
         * @param missing testcases missing from object compared against
         * @param common comparison results of all testcases shared between
         *             the two `ResultFile` objects.
         */
        struct TOUCA_CLIENT_API ComparisonResult {
            ElementsMap fresh;
            ElementsMap missing;
            std::map<std::string, compare::TestcaseComparison> common;

            /**
             * @brief provides description of this object in json format.
             *
             * @return string representation of the comparison result
             *         between two result files in json format
             */
            std::string json() const;
        };

        /**
         * @param path to result file to be read or created
         *
         * @note this constructor is intentionally crafted to perform no
         *       operation. instantiating an object of this class with
         *       a path to a file does not trigger validation or parsing
         *       of that file. It does not guarantee that the file can
         *       be read from or written into.
         */
        explicit ResultFile(const touca::filesystem::path& path);

        /**
         * Checks if content of the regular file on disk associated with
         * this object describes valid test results.
         *
         * @return true if the object refers to a regular file on disk
         *         whose content describes valid test results.
         */
        bool validate() const;

        /**
         * Updates this object to hold test results stored in the regular
         * file on disk associated with this object.
         *
         * Calling other member functions such as `validate`, `parse`,
         * `readFileInJson` or `compare` does **not** require loading
         * the file first. This operation is only helpful to speed-up
         * other operations if they are to be called several times.
         *
         * @throw std::runtime_error if file is missing or is not a valid
         *        test result file.
         */
        void load();

        /**
         * Checks if this object has a non-empty set of results that are
         * either loaded from disk or stored while being saved to disk.
         *
         * @return whether this object stores a non-empty set of results
         */
        bool isLoaded() const;

        /**
         * Writes all loaded testcases into a single binary file whose
         * path is provided at the time of initialization.
         * If the file already exists, its content will be overwritten.
         *
         * @throw std::runtime_error if operation fails
         */
        void save();

        /**
         * Updates content of this file with provided binary data.
         * If the file already exists, its content will be overwritten.
         *
         * @param testcases list of `Testcase` objects whose information
         *                  should be stored in the file in serialized
         *                  binary format compliant
         *
         * @throw std::runtime_error if operation fails
         */
        void save(const std::vector<Testcase>& testcases);

        /**
         * Parses content of a the regular file on disk associated with
         * this object, assuming that it is a valid test result file.
         *
         * @throw std::runtime_error if file is missing or is not a valid
         *        test result file.
         *
         * @return parsed test results in form of a list of `Testcase` objects
         */
        ElementsMap parse() const;

        /**
         * Provides a string representation of test results stored in
         * the specified file on disk that is associated with this object,
         * in json format.
         *
         * @note name of this function is chosen to expressly note
         *       that the function provides json view of the file already
         *       stored on disk and not the stored state of the object.
         *
         * @return string representation of test results stored in the
         *         specified file in json format
         */
        std::string readFileInJson() const;

        /**
         * Parses and includes all testcases stored in a given binary
         * file in the list of testcases for this file.
         *
         * @param other result file to be merged
         */
        void merge(const ResultFile& other);

        /**
         * Compares the result file on disk that this object is associated
         * with, with the result file on disk associated with another given
         * object of this class.
         *
         * @param other result file to compare against
         *
         * @return an object describing comparison results between the
         *         two given files
         */
        ResultFile::ComparisonResult compare(const ResultFile& other) const;

    private:
        /**
         * @brief Checks if a given string describes valid test results in
         *        well-structured flatbuffers binary format.
         *
         * @details Used by `parse` and `validate` functions.
         *
         * @return true if the given string describes valid test results
         */
        bool validate(const std::string& content) const;

        ElementsMap _testcases;
        touca::filesystem::path _path;
    };

} // namespace touca
