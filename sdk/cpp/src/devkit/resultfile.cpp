// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/devkit/resultfile.hpp"
#include "rapidjson/document.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"
#include "touca/devkit/utils.hpp"
#include "touca/impl/touca_generated.h"
#include <fstream>

namespace touca {

    /**
     *
     */
    ResultFile::ResultFile(const touca::filesystem::path& path)
        : _path(path)
    {
    }

    /**
     *
     */
    bool ResultFile::validate() const
    {
        // if file is already loaded, we have already validated its content
        if (!_testcases.empty()) {
            return true;
        }

        // file must exist in order to be valid
        if (!touca::filesystem::is_regular_file(_path)) {
            return false;
        }
        const auto& content = load_string_file(_path.string(), std::ios::in | std::ios::binary);
        return validate(content);
    }

    /**
     *
     */
    bool ResultFile::validate(const std::string& content) const
    {
        const auto& buffer = (const uint8_t*)content.data();
        const auto& length = content.size();
        flatbuffers::Verifier verifier(buffer, length);
        return verifier.VerifyBuffer<touca::fbs::Messages>();
    }

    /**
     *
     */
    ElementsMap ResultFile::parse() const
    {
        // if file is already loaded, return the already parsed testcases
        if (!_testcases.empty()) {
            return _testcases;
        }

        const auto& content = load_string_file(_path.string(), std::ios::in | std::ios::binary);

        // verify that given content represents valid flatbuffers data
        if (!validate(content)) {
            throw std::runtime_error("result file invalid: " + _path.string());
        }

        ElementsMap testcases;
        // parse content of given file
        const auto& messages = touca::fbs::GetMessages(content.c_str());
        for (const auto&& message : *messages->messages()) {
            const auto& buffer = message->buf();
            const auto& ptr = buffer->data();
            std::vector<uint8_t> data(ptr, ptr + buffer->size());
            const auto& testcase = std::make_shared<Testcase>(data);
            testcases.emplace(testcase->metadata().testcase, testcase);
        }
        return testcases;
    }

    /**
     *
     */
    void ResultFile::load()
    {
        _testcases = parse();
    }

    /**
     *
     */
    bool ResultFile::isLoaded() const
    {
        return !_testcases.empty();
    }

    /**
     *
     */
    void ResultFile::save()
    {
        std::vector<Testcase> tcs;
        for (const auto& testcase : _testcases) {
            tcs.emplace_back(*testcase.second);
        }
        return save(tcs);
    }

    /**
     *
     */
    void ResultFile::save(const std::vector<Testcase>& testcases)
    {
        // create parent directory if it does not exist
        touca::filesystem::path dstFile { _path };
        const auto parentPath = touca::filesystem::absolute(dstFile.parent_path());
        if (!touca::filesystem::exists(parentPath.string()) && !touca::filesystem::create_directories(parentPath)) {
            throw std::invalid_argument("failed to create parent path");
        }
        // write content of testcases to the filesystem
        const auto buffer = Testcase::serialize(testcases);
        try {
            std::ofstream out(_path, std::ios::binary);
            out.write((const char*)buffer.data(), buffer.size());
            out.close();
        } catch (const std::exception& ex) {
            const auto& msg = "failed to save content to disk: {}";
            throw std::invalid_argument(fmt::format(msg, ex.what()));
        }
        // update map of stored testcases so that it only contains entries
        // for the new testcases we used for saving the file
        load();
    }

    /**
     *
     */
    std::string ResultFile::readFileInJson() const
    {
        const auto testcases = _testcases.empty() ? parse() : _testcases;

        rapidjson::Document doc(rapidjson::kArrayType);
        rapidjson::Document::AllocatorType& allocator = doc.GetAllocator();

        for (const auto& item : testcases) {
            auto val = item.second->json(allocator);
            doc.PushBack(val, allocator);
        }

        // return string version of the constructed json
        rapidjson::StringBuffer strbuf;
        rapidjson::Writer<rapidjson::StringBuffer> writer(strbuf);
        writer.SetMaxDecimalPlaces(3);
        doc.Accept(writer);
        return strbuf.GetString();
    }

    /**
     *
     */
    void ResultFile::merge(const ResultFile& other)
    {
        const auto tcs = other.parse();
        _testcases.insert(tcs.begin(), tcs.end());
    }

    /**
     *
     */
    ResultFile::ComparisonResult ResultFile::compare(
        const ResultFile& other) const
    {
        const auto srcCases = _testcases.empty() ? parse() : _testcases;
        const auto dstCases = other.parse();
        ComparisonResult cmp;
        for (const auto& tc : srcCases) {
            const auto& key = tc.first;
            if (dstCases.count(key)) {
                const auto value = tc.second->compare(dstCases.at(key));
                cmp.common.emplace(key, value);
                continue;
            }
            cmp.fresh.emplace(tc);
        }
        for (const auto& tc : dstCases) {
            const auto& key = tc.first;
            if (!srcCases.count(key)) {
                cmp.missing.emplace(tc);
            }
        }
        return cmp;
    }

    /**
     *
     */
    std::string ResultFile::ComparisonResult::json() const
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

        rapidjson::Document doc(rapidjson::kObjectType);
        auto& allocator = doc.GetAllocator();

        // add new testcases to json object
        rapidjson::Value rjFresh(rapidjson::kArrayType);
        for (const auto& item : fresh) {
            auto val = fromMetadata(item.second->metadata(), allocator);
            rjFresh.PushBack(val, allocator);
        }

        // add missing testcases to json object
        rapidjson::Value rjMissing(rapidjson::kArrayType);
        for (const auto& item : missing) {
            auto val = fromMetadata(item.second->metadata(), allocator);
            rjMissing.PushBack(val, allocator);
        }

        // add common testcases to json object
        rapidjson::Value rjCommon(rapidjson::kArrayType);
        for (const auto& item : common) {
            rjCommon.PushBack(item.second.json(allocator), allocator);
        }

        doc.AddMember("newCases", rjFresh, allocator);
        doc.AddMember("missingCases", rjMissing, allocator);
        doc.AddMember("commonCases", rjCommon, allocator);

        // return string version of the constructed json in pretty print format
        rapidjson::StringBuffer strbuf;
        rapidjson::Writer<rapidjson::StringBuffer> writer(strbuf);
        writer.SetMaxDecimalPlaces(3);
        doc.Accept(writer);
        return strbuf.GetString();
    }

} // namespace touca
