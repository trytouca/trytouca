// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "touca/devkit/testcase.hpp"
#include "touca/devkit/types.hpp"
#include <numeric>
#include <unordered_map>

namespace touca { namespace compare {

    /**
     * @enum touca::compare::MatchType
     * @brief describes overall result of comparing two testcases
     */
    enum class MatchType : unsigned char {
        Perfect, /**< Indicates that compared objects were identical */
        None /**< Indicates that compared objects were different */
    };

    /**
     *
     */
    struct TOUCA_CLIENT_API TypeComparison {
        std::string srcValue;
        std::string dstValue;
        types::ValueType srcType = types::ValueType::Unknown;
        types::ValueType dstType = types::ValueType::Unknown;
        double score = 0.0;
        std::set<std::string> desc;
        MatchType match = MatchType::None;
    };

    /**
     *
     */
    using ComparisonMap = std::unordered_map<std::string, TypeComparison>;

    /**
     *
     */
    enum class Category {
        Common,
        Missing,
        Fresh
    };

    /**
     *
     */
    struct Cellar {
        ComparisonMap common;
        KeyMap missing;
        KeyMap fresh;

        /**
         *
         */
        rapidjson::Value json(RJAllocator& allocator) const;

    private:
        /**
         *
         */
        std::string stringify(const types::ValueType type) const;

        /**
         *
         */
        rapidjson::Value buildJsonSolo(
            const KeyMap& elements,
            RJAllocator& allocator,
            const Category category) const;

        /**
         *
         */
        rapidjson::Value buildJsonCommon(
            const ComparisonMap& elements,
            RJAllocator& allocator) const;
    };

    /**
     *
     */
    class TOUCA_CLIENT_API TestcaseComparison {
    public:
        /**
         *
         */
        struct TOUCA_CLIENT_API Overview {
            std::int32_t keysCountCommon;
            std::int32_t keysCountFresh;
            std::int32_t keysCountMissing;
            double keysScore;
            std::int32_t metricsCountCommon;
            std::int32_t metricsCountFresh;
            std::int32_t metricsCountMissing;
            std::int32_t metricsDurationCommonDst;
            std::int32_t metricsDurationCommonSrc;

            /**
             *
             */
            rapidjson::Value json(RJAllocator& allocator) const;
        };

        /**
         *
         */
        TestcaseComparison(const Testcase& src, const Testcase& dst);

        /**
         *
         */
        rapidjson::Value json(RJAllocator& allocator) const;

        /**
         *
         */
        Overview overview() const;

    private:
        /**
         *
         */
        double scoreResults() const;

        /**
         *
         */
        void compare();

        /**
         *
         */
        void initCellar(const KeyMap& src, const KeyMap& dst, Cellar& result);

        /**
         *
         */
        void initMetadata(const Testcase& tc, Testcase::Metadata& meta);

        // metadata
        Testcase::Metadata _srcMeta;
        Testcase::Metadata _dstMeta;
        // containers to hold comparison results
        Cellar _assertions;
        Cellar _results;
        Cellar _metrics;
        // pointers to testcases we are comparing
        const Testcase& _src;
        const Testcase& _dst;
    };

}} // namespace touca::compare
