// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/cli/deserialize.hpp"

#include "catch2/catch.hpp"
#include "tests/core/shared.hpp"
#include "touca/cli/comparison.hpp"
#include "touca/client/detail/client.hpp"
#include "touca/core/filesystem.hpp"
#include "touca/core/serializer.hpp"
#include "touca/impl/schema.hpp"

using touca::detail::internal_type;

std::string serialize(const touca::data_point& value) {
  flatbuffers::FlatBufferBuilder builder;
  const auto& wrapper = value.serialize(builder);
  builder.Finish(wrapper);
  const auto& ptr = builder.GetBufferPointer();
  return {ptr, ptr + builder.GetSize()};
}

touca::data_point deserialize(const std::string& buffer) {
  flatbuffers::Verifier verifier((const uint8_t*)buffer.data(), buffer.size());
  CHECK(verifier.VerifyBuffer<touca::fbs::TypeWrapper>());
  const auto& wrapper =
      flatbuffers::GetRoot<touca::fbs::TypeWrapper>(buffer.data());
  return touca::deserialize_value(wrapper);
}

TEST_CASE("Serialize and Deserialize Data Types") {
  using touca::data_point;
  using touca::MatchType;

  SECTION("type: null") {
    auto value = data_point::null();
    SECTION("initialize") {
      CHECK(value.to_string() == "null");
      CHECK(internal_type::null == value.type());
    }
  }

  SECTION("type: bool") {
    const auto& value = data_point::boolean(true);
    SECTION("serialize") {
      const auto& buffer = serialize(value);
      const auto& deserialized = deserialize(buffer);
      const auto& cmp = compare(value, deserialized);
      CHECK(internal_type::boolean == deserialized.type());
      CHECK(deserialized.to_string() == "true");
      CHECK(internal_type::boolean == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "true");
      CHECK(cmp.dstValue == "");
      CHECK(MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }
  }

  SECTION("type: number integer") {
    SECTION("serialize") {
      const auto& value = data_point::number_signed(42);
      const auto& buffer = serialize(value);
      const auto& deserialized = deserialize(buffer);
      const auto& cmp = compare(value, deserialized);
      CHECK(internal_type::number_signed == deserialized.type());
      CHECK(deserialized.to_string() == "42");
      CHECK(internal_type::number_signed == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "42");
      CHECK(cmp.dstValue == "");
      CHECK(MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }
  }

  SECTION("type: double") {
    SECTION("serialize") {
      const auto& value = data_point::number_double(1.0);
      const auto& buffer = serialize(value);
      const auto& deserialized = deserialize(buffer);
      const auto& cmp = compare(value, deserialized);
      CHECK(internal_type::number_double == deserialized.type());
      CHECK(deserialized.to_string() == "1.0");
      CHECK(internal_type::number_double == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "1.0");
      CHECK(cmp.dstValue == "");
      CHECK(MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }
  }

  SECTION("type: string") {
    SECTION("serialize") {
      const auto& value = data_point::string("some_value");
      const auto& buffer = serialize(value);
      const auto& deserialized = deserialize(buffer);
      const auto& cmp = compare(value, deserialized);
      CHECK(internal_type::string == deserialized.type());
      CHECK(deserialized.to_string() == "some_value");
      CHECK(internal_type::string == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "some_value");
      CHECK(cmp.dstValue == "");
      CHECK(MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }
  }

  SECTION("type: array") {
    SECTION("compare: match value of type int") {
      const auto& makeArray = [](const std::vector<int>& vec) -> data_point {
        touca::array ret;
        for (const auto& v : vec) {
          ret.add(v);
        }
        return ret;
      };
      const auto& value = makeArray({41, 42, 43, 44});
      const auto& buffer = serialize(value);
      const auto& itype = deserialize(buffer);
      const auto& cmp = compare(value, itype);

      CHECK(internal_type::array == itype.type());
      CHECK(itype.to_string() == R"([41,42,43,44])");
      CHECK(internal_type::array == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == R"([41,42,43,44])");
      CHECK(cmp.dstValue == "");
      CHECK(MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: match value of type float") {
      const auto& makeArray = [](const std::vector<float>& vec) -> data_point {
        touca::array ret;
        for (const auto& v : vec) {
          ret.add(v);
        }
        return ret;
      };
      const auto& value = makeArray({1.1f, 1.2f, 1.3f, 1.4f});
      const auto& buffer = serialize(value);
      const auto& itype = deserialize(buffer);
      const auto& cmp = compare(value, itype);

      CHECK(internal_type::array == itype.type());
      CHECK(itype.to_string() == R"([1.1,1.2,1.299,1.399])");
      CHECK(internal_type::array == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == R"([1.1,1.2,1.299,1.399])");
      CHECK(cmp.dstValue == "");
      CHECK(MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: match value of type string") {
      const auto& makeArray =
          [](const std::vector<std::string>& vec) -> data_point {
        touca::array ret;
        for (const auto& v : vec) {
          ret.add(v);
        }
        return ret;
      };
      const auto& value = makeArray({"a", "b", "c", "d"});
      const auto& buffer = serialize(value);
      const auto& itype = deserialize(buffer);

      CHECK(internal_type::array == itype.type());
      CHECK(itype.to_string() == R"(["a","b","c","d"])");
      const auto& cmp = compare(value, itype);
      CHECK(internal_type::array == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == R"(["a","b","c","d"])");
      CHECK(cmp.dstValue == "");
      CHECK(MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("serialize") {
      const auto& makeArray = [](const std::vector<bool>& vec) -> data_point {
        touca::array ret;
        for (const auto&& v : vec) {
          ret.add(touca::serializer<bool>().serialize(v));
        }
        return ret;
      };
      const auto& value = makeArray({false, true, false, true});
      const auto& buffer = serialize(value);
      const auto& itype = deserialize(buffer);
      const auto& cmp = compare(value, itype);

      CHECK(internal_type::array == itype.type());
      CHECK(itype.to_string() == R"([false,true,false,true])");
      CHECK(internal_type::array == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == R"([false,true,false,true])");
      CHECK(cmp.dstValue == "");
      CHECK(MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }
  }

  SECTION("type: object") {
    SECTION("initialize: add number to object") {
      touca::object value("creature");
      CHECK_NOTHROW(data_point(value));
      CHECK(flatten(value).empty());
      CHECK(data_point(value).to_string() == R"({"creature":{}})");
      value.add("number of heads", 1);
      CHECK(flatten(value).count("number of heads"));
      CHECK(data_point(value).to_string() ==
            R"({"creature":{"number of heads":1}})");
      value.add("number of tails", 0);
      CHECK(flatten(value).count("number of tails"));
      CHECK(data_point(value).to_string() ==
            R"({"creature":{"number of heads":1,"number of tails":0}})");
    }

    SECTION("initialize: add object to object") {
      touca::object value("creature");
      CHECK(flatten(value).empty());
      Head head1(2);
      value.add("first_head", head1);
      CHECK(flatten(value).count("first_head.eyes"));
      CHECK(data_point(value).to_string() ==
            R"({"creature":{"first_head":{"head":{"eyes":2}}}})");
    }

    SECTION("compare: match") {
      touca::object value("creature");
      value.add("first_head", Head(2));
      touca::object right("some_other_creature");
      right.add("first_head", Head(2));
      const auto& cmp = compare(value, right);

      CHECK(internal_type::object == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue ==
            R"({"creature":{"first_head":{"head":{"eyes":2}}}})");
      CHECK(cmp.dstValue == R"()");
      CHECK(MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch value") {
      touca::object value("creature");
      value.add("first_head", Head(2));
      touca::object right("some_other_creature");
      right.add("first_head", Head(3));
      const auto& cmp = compare(value, right);

      CHECK(internal_type::object == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue ==
            R"({"creature":{"first_head":{"head":{"eyes":2}}}})");
      CHECK(cmp.dstValue ==
            R"({"some_other_creature":{"first_head":{"head":{"eyes":3}}}})");
      CHECK(MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.size() == 1u);
      CHECK(cmp.desc.count("first_head.eyes: value is smaller by 1.000000"));
    }

    SECTION("serialize") {
      touca::object value("creature");
      value.add("first_head", Head(2));
      const auto& buffer = serialize(value);
      const auto& itype = deserialize(buffer);
      const auto& expected =
          R"({"creature":{"first_head":{"head":{"eyes":2}}}})";
      const auto& cmp = compare(value, itype);

      CHECK(internal_type::object == itype.type());
      CHECK(itype.to_string() == expected);
      CHECK(internal_type::object == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == expected);
      CHECK(cmp.dstValue == "");
      CHECK(MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }
  }
}

TEST_CASE("Deserialize file") {
  touca::ClientImpl client;
  REQUIRE_NOTHROW(client.configure([](touca::ClientOptions& x) {
    x.team = "myteam";
    x.suite = "mysuite";
    x.version = "myversion";
    x.offline = true;
  }));
  REQUIRE(client.is_configured() == true);
  CHECK(client.configuration_error().empty() == true);

  SECTION("testcase switch") {
    CHECK_NOTHROW(client.add_hit_count("ignored-key"));
    CHECK(client.declare_testcase("some-case"));
    CHECK_NOTHROW(client.add_hit_count("some-key"));
    CHECK(client.declare_testcase("some-other-case"));
    CHECK_NOTHROW(client.add_hit_count("some-other-key"));
    CHECK(client.declare_testcase("some-case"));
    CHECK_NOTHROW(client.add_hit_count("some-other-key"));

    TmpFile file;
    CHECK_NOTHROW(client.save(file.path, {}, touca::DataFormat::FBS, true));
    const auto& content = touca::deserialize_file(file.path);

    REQUIRE(content.count("some-case"));
    REQUIRE(content.count("some-other-case"));
    CHECK(content.at("some-case")->overview().keysCount == 2);
    CHECK(content.at("some-other-case")->overview().keysCount == 1);
  }
}
