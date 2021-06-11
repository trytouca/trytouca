// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/devkit/comparison.hpp"
#include "rapidjson/document.h"
#include "rapidjson/rapidjson.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"
#include <chrono>

namespace touca { namespace compare {

    /**
     *
     */
    std::string Cellar::stringify(const types::ValueType type) const
    {
        using vt = types::ValueType;
        const std::unordered_map<types::ValueType, std::string> store = {
            { vt::Bool, "bool" },
            { vt::Number, "number" },
            { vt::String, "string" },
            { vt::Array, "array" },
            { vt::Object, "object" }
        };
        if (store.count(type)) {
            return store.at(type);
        }
        return "unknown";
    }

    /**
     *
     */
    rapidjson::Value Cellar::json(
        rapidjson::Document::AllocatorType& allocator) const
    {
        auto rjCommon = buildJsonCommon(common, allocator);
        auto rjMissing = buildJsonSolo(missing, allocator, Category::Missing);
        auto rjFresh = buildJsonSolo(fresh, allocator, Category::Fresh);
        rapidjson::Value result(rapidjson::kObjectType);
        result.AddMember("commonKeys", rjCommon, allocator);
        result.AddMember("missingKeys", rjMissing, allocator);
        result.AddMember("newKeys", rjFresh, allocator);
        return result;
    }

    /**
     *
     */
    rapidjson::Value Cellar::buildJsonSolo(
        const KeyMap& keyMap,
        rapidjson::Document::AllocatorType& allocator,
        const Category category) const
    {
        rapidjson::Value rjElements(rapidjson::kArrayType);
        for (const auto& kv : keyMap) {
            const auto& type = stringify(kv.second->type());
            rapidjson::Value rjEntry(rapidjson::kObjectType);
            rjEntry.AddMember("name", kv.first, allocator);
            if (category == Category::Fresh) {
                rjEntry.AddMember("srcType", type, allocator);
                rjEntry.AddMember("srcValue", kv.second->string(), allocator);
            } else {
                rjEntry.AddMember("dstType", type, allocator);
                rjEntry.AddMember("dstValue", kv.second->string(), allocator);
            }
            rjElements.PushBack(rjEntry, allocator);
        }
        return rjElements;
    }

    /**
     *
     */
    rapidjson::Value Cellar::buildJsonCommon(
        const ComparisonMap& elements,
        rapidjson::Document::AllocatorType& allocator) const
    {
        namespace rj = rapidjson;
        rj::Value rjElements(rapidjson::kArrayType);
        for (const auto& kv : elements) {
            rj::Value rjDstType;
            rj::Value rjDstValue;
            rj::Value rjDesc(rj::kArrayType);

            rj::Value rjName { kv.first, allocator };
            rj::Value rjScore { kv.second.score };
            rj::Value rjSrcType { stringify(kv.second.srcType), allocator };
            rj::Value rjSrcValue { kv.second.srcValue, allocator };
            if (types::ValueType::Unknown != kv.second.dstType) {
                rjDstType.Set(stringify(kv.second.dstType), allocator);
            }
            if (compare::MatchType::Perfect != kv.second.match) {
                rjDstValue.Set(kv.second.dstValue, allocator);
            }
            if (!kv.second.desc.empty()) {
                for (const auto& entry : kv.second.desc) {
                    rj::Value rjEntry(rj::kStringType);
                    rjEntry.SetString(entry, allocator);
                    rjDesc.PushBack(rjEntry, allocator);
                }
            }

            rj::Value rjElement(rj::kObjectType);
            rjElement.AddMember("name", rjName, allocator);
            rjElement.AddMember("score", rjScore, allocator);
            rjElement.AddMember("srcType", rjSrcType, allocator);
            rjElement.AddMember("srcValue", rjSrcValue, allocator);
            if (types::ValueType::Unknown != kv.second.dstType) {
                rjElement.AddMember("dstType", rjDstType, allocator);
            }
            if (compare::MatchType::Perfect != kv.second.match) {
                rjElement.AddMember("dstValue", rjDstValue, allocator);
            }
            if (!kv.second.desc.empty()) {
                rjElement.AddMember("desc", rjDesc, allocator);
            }
            rjElements.PushBack(rjElement, allocator);
        }
        return rjElements;
    }

    /**
     *
     */
    TestcaseComparison::TestcaseComparison(
        const Testcase& src,
        const Testcase& dst)
        : _src(src)
        , _dst(dst)
    {
        compare();
    }

    /**
     *
     */
    rapidjson::Value TestcaseComparison::Overview::json(
        rapidjson::Document::AllocatorType& allocator) const
    {
        rapidjson::Value out(rapidjson::kObjectType);
        out.AddMember("keysCountCommon", keysCountCommon, allocator);
        out.AddMember("keysCountFresh", keysCountFresh, allocator);
        out.AddMember("keysCountMissing", keysCountMissing, allocator);
        out.AddMember("keysScore", keysScore, allocator);
        out.AddMember("metricsCountCommon", metricsCountCommon, allocator);
        out.AddMember("metricsCountFresh", metricsCountFresh, allocator);
        out.AddMember("metricsCountMissing", metricsCountMissing, allocator);
        out.AddMember(
            "metricsDurationCommonDst", metricsDurationCommonDst, allocator);
        out.AddMember(
            "metricsDurationCommonSrc", metricsDurationCommonSrc, allocator);
        return out;
    }

    /**
     *
     */
    rapidjson::Value TestcaseComparison::json(
        rapidjson::Document::AllocatorType& allocator) const
    {
        const auto& fromMetadata =
            [](const Testcase::Metadata& meta,
                rapidjson::Document::AllocatorType& allocator) {
                rapidjson::Value value(rapidjson::kObjectType);
                value.AddMember("teamslug", meta.teamslug, allocator);
                value.AddMember("testsuite", meta.testsuite, allocator);
                value.AddMember("version", meta.version, allocator);
                value.AddMember("testcase", meta.testcase, allocator);
                value.AddMember("builtAt", meta.builtAt, allocator);
                return value;
            };

        rapidjson::Value out(rapidjson::kObjectType);
        out.AddMember("src", fromMetadata(_srcMeta, allocator), allocator);
        out.AddMember("dst", fromMetadata(_dstMeta, allocator), allocator);
        out.AddMember("assertions", _assertions.json(allocator), allocator);
        out.AddMember("results", _results.json(allocator), allocator);
        out.AddMember("metrics", _metrics.json(allocator), allocator);
        return out;
    }

    /**
     *
     */
    double TestcaseComparison::scoreResults() const
    {
        using pair_t = std::pair<std::string, TypeComparison>;
        const auto& op = [](const double t, const pair_t& item) {
            return t + item.second.score;
        };
        const auto sum = std::accumulate(
            _results.common.begin(), _results.common.end(), 0.0, op);

        // if the two cases have no keys in common, report a score of one
        // if dst has no keys at all and a score of zero if src is missing
        // some keys.
        if (_results.common.empty()) {
            return _results.missing.empty() ? 1.0 : 0.0;
        }

        const auto count = _results.common.size() + _results.missing.size();
        return sum / count;
    }

    /**
     *
     */
    TestcaseComparison::Overview TestcaseComparison::overview() const
    {
        Overview output;

        const auto count = [](const size_t size) {
            return static_cast<std::int32_t>(size);
        };

        output.keysCountCommon = count(_results.common.size());
        output.keysCountFresh = count(_results.fresh.size());
        output.keysCountMissing = count(_results.missing.size());
        output.keysScore = scoreResults();

        output.metricsCountCommon = count(_metrics.common.size());
        output.metricsCountFresh = count(_metrics.fresh.size());
        output.metricsCountMissing = count(_metrics.missing.size());

        const auto getTotalCommonDuration = [this](const Testcase& tc) {
            namespace chr = std::chrono;
            std::int32_t duration = 0u;
            for (const auto& kvp : _metrics.common) {
                const auto& diff = tc._tocs.at(kvp.first) - tc._tics.at(kvp.first);
                duration += static_cast<std::int32_t>(
                    chr::duration_cast<chr::milliseconds>(diff).count());
            }
            return duration;
        };

        output.metricsDurationCommonSrc = getTotalCommonDuration(_src);
        output.metricsDurationCommonDst = getTotalCommonDuration(_dst);

        return output;
    }

    /**
     *
     */
    void TestcaseComparison::compare()
    {
        // initialize metadata
        _srcMeta = _src.metadata();
        _dstMeta = _dst.metadata();
        // perform comparisons on assertions
        initCellar(_src._assertionsMap, _dst._assertionsMap, _assertions);
        initCellar(_src._resultsMap, _dst._resultsMap, _results);
        initCellar(_src.metrics(), _dst.metrics(), _metrics);
    }

    /**
     *
     */
    void TestcaseComparison::initCellar(
        const KeyMap& src,
        const KeyMap& dst,
        Cellar& result)
    {
        for (const auto& kv : dst) {
            const auto& key = kv.first;
            if (src.count(key)) {
                const auto value = src.at(key)->compare(kv.second);
                result.common.emplace(key, value);
                continue;
            }
            result.missing.emplace(key, kv.second);
        }
        for (const auto& kv : src) {
            const auto& key = kv.first;
            if (!dst.count(key)) {
                result.fresh.emplace(key, kv.second);
            }
        }
    }

}} // namespace touca::compare
