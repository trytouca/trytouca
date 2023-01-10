// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include <fstream>

#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "touca/core/filesystem.hpp"
#include "touca/core/serializer.hpp"

class Head {
  friend struct touca::serializer<Head>;

 public:
  explicit Head(const uint64_t eyes) : _eyes(eyes) {}

 private:
  uint64_t _eyes;
};

template <>
struct touca::serializer<Head> {
  data_point serialize(const Head& value) {
    return object("head").add("eyes", value._eyes);
  }
};

/**
 * Helper function to provide `Testcase`, `TestcaseComparison`
 * and `TestcaseComparison::Overview` as json string.
 */
std::string make_json(
    const std::function<rapidjson::Value(touca::RJAllocator&)> func);

struct TmpFile {
  TmpFile() : path(make_temp_path()) {}

  void write(const std::string& content) const {
    std::ofstream ofs(path);
    ofs << content;
    ofs.close();
  }

  ~TmpFile() {
    if (touca::filesystem::exists(path)) {
      touca::filesystem::remove_all(path);
    }
  }

  const touca::filesystem::path path;

 private:
  touca::filesystem::path make_temp_path() const {
    const auto filename = touca::detail::format("touca_{}", std::rand());
    return touca::filesystem::temp_directory_path() / filename;
  }
};
