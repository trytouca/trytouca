// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "catch2/catch.hpp"
#include "touca/client/convert.hpp"
#include "touca/core/object.hpp"
#include "touca/devkit/comparison.hpp"
#include "touca/impl/schema.hpp"

namespace creature {

class Head {
  friend struct touca::converter<creature::Head>;

 public:
  explicit Head(const uint64_t eyes) : _eyes(eyes) {}

 private:
  uint64_t _eyes;
};

}  // namespace creature

template <>
struct touca::converter<creature::Head> {
  std::shared_ptr<types::IType> convert(const creature::Head& value) {
    auto out = std::make_shared<types::ObjectType>("head");
    out->add("eyes", value._eyes);
    return out;
  }
};

std::string serialize(const std::shared_ptr<touca::types::IType>& value) {
  flatbuffers::FlatBufferBuilder builder;
  const auto& wrapper = value->serialize(builder);
  builder.Finish(wrapper);
  const auto& ptr = builder.GetBufferPointer();
  return {ptr, ptr + builder.GetSize()};
}

std::shared_ptr<touca::types::IType> deserialize(const std::string& buffer) {
  using namespace touca;
  using namespace flatbuffers;
  Verifier verifier((const uint8_t*)buffer.data(), buffer.size());
  CHECK(verifier.VerifyBuffer<fbs::TypeWrapper>());
  const auto& wrapper = GetRoot<fbs::TypeWrapper>(buffer.data());
  return types::deserializeValue(wrapper);
}

TEST_CASE("Simple Data Types") {
  using namespace touca;

  SECTION("type: bool") {
    const auto& value = std::make_shared<types::BooleanType>(true);

    SECTION("initialize") {
      CHECK(value->flatten().empty());
      CHECK(value->string() == "true");
      CHECK(types::value_t::boolean == value->type());
    }

    SECTION("compare: match") {
      const auto& right = std::make_shared<types::BooleanType>(true);
      const auto& cmp = value->compare(right);
      CHECK(types::value_t::boolean == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "true");
      CHECK(cmp.dstValue == "");
      CHECK(compare::MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch value") {
      const auto& right = std::make_shared<types::BooleanType>(false);
      const auto& cmp = value->compare(right);
      CHECK(types::value_t::boolean == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "true");
      CHECK(cmp.dstValue == "false");
      CHECK(compare::MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch type") {
      const auto& right = std::make_shared<types::StringType>("true");
      const auto& cmp = value->compare(right);
      CHECK(types::value_t::boolean == cmp.srcType);
      CHECK(types::value_t::string == cmp.dstType);
      CHECK(cmp.srcValue == "true");
      CHECK(cmp.dstValue == "true");
      CHECK(compare::MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.size() == 1u);
      CHECK(cmp.desc.count("result types are different"));
    }

    SECTION("serialize") {
      const auto& buffer = serialize(value);
      const auto& itype = deserialize(buffer);
      const auto& cmp = value->compare(itype);
      CHECK(types::value_t::boolean == itype->type());
      CHECK(itype->string() == "true");
      CHECK(types::value_t::boolean == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "true");
      CHECK(cmp.dstValue == "");
      CHECK(compare::MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }
  }

  SECTION("type: number integer") {
    SECTION("initialize") {
      types::Number<int> value(42);
      CHECK(value.flatten().empty());
      CHECK(value.string() == "42");
      CHECK(types::value_t::numeric == value.type());
    }

    SECTION("compare: match") {
      types::Number<int> value(42);
      const auto& right = std::make_shared<types::Number<int>>(42);
      const auto& cmp = value.compare(right);
      CHECK(types::value_t::numeric == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "42");
      CHECK(cmp.dstValue == "");
      CHECK(compare::MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch: smaller") {
      types::Number<int> value(5);
      const auto& right = std::make_shared<types::Number<int>>(10);
      const auto& cmp = value.compare(right);
      CHECK(types::value_t::numeric == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "5");
      CHECK(cmp.dstValue == "10");
      CHECK(compare::MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.size() == 1u);
      CHECK(cmp.desc.count("value is smaller by 5.000000"));
    }

    SECTION("compare: mismatch: percent") {
      types::Number<int> value(12);
      const auto& right = std::make_shared<types::Number<int>>(10);
      const auto& cmp = value.compare(right);
      CHECK(types::value_t::numeric == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "12");
      CHECK(cmp.dstValue == "10");
      CHECK(compare::MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.size() == 1u);
      CHECK(cmp.desc.count("value is larger by 20.000000 percent"));
    }

    SECTION("compare: mismatch type") {
      types::Number<int> value(42);
      const auto& right = std::make_shared<types::BooleanType>(false);
      const auto& cmp = value.compare(right);
      CHECK(types::value_t::numeric == cmp.srcType);
      CHECK(types::value_t::boolean == cmp.dstType);
      CHECK(cmp.srcValue == "42");
      CHECK(cmp.dstValue == "false");
      CHECK(compare::MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.size() == 1u);
      CHECK(cmp.desc.count("result types are different"));
    }

    SECTION("serialize") {
      const auto& value = std::make_shared<types::Number<int64_t>>(42);
      const auto& buffer = serialize(value);
      const auto& itype = deserialize(buffer);
      const auto& cmp = value->compare(itype);
      CHECK(types::value_t::numeric == itype->type());
      CHECK(itype->string() == "42");
      CHECK(types::value_t::numeric == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "42");
      CHECK(cmp.dstValue == "");
      CHECK(compare::MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }
  }

  SECTION("type: double") {
    SECTION("initialize") {
      types::Number<double> value(0.0);
      CHECK(value.flatten().empty());
      CHECK(value.string() == "0.0");
      CHECK(types::value_t::numeric == value.type());
    }

    SECTION("match") {
      types::Number<double> value(1.0);
      const auto& right = std::make_shared<types::Number<double>>(1.0);
      const auto& cmp = value.compare(right);
      CHECK(types::value_t::numeric == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "1.0");
      CHECK(cmp.dstValue == "");
      CHECK(compare::MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch value") {
      types::Number<double> value(0.0);
      const auto& right = std::make_shared<types::Number<double>>(1.0);
      const auto& cmp = value.compare(right);
      CHECK(types::value_t::numeric == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "0.0");
      CHECK(cmp.dstValue == "1.0");
      CHECK(compare::MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.size() == 1u);
      CHECK(cmp.desc.count("value is smaller by 1.000000"));
    }

    SECTION("compare: mismatch value: percent") {
      types::Number<double> value(1.1);
      const auto& right = std::make_shared<types::Number<double>>(1.0);
      const auto& cmp = value.compare(right);
      CHECK(types::value_t::numeric == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "1.1");
      CHECK(cmp.dstValue == "1.0");
      CHECK(compare::MatchType::None == cmp.match);
      CHECK(cmp.score == Approx(0.9));
      CHECK(cmp.desc.size() == 1u);
      CHECK(cmp.desc.count("value is larger by 10.000000 percent"));
    }

    SECTION("compare: mismatch type") {
      types::Number<double> value(1.0);
      const auto& right = std::make_shared<types::BooleanType>(false);
      const auto& cmp = value.compare(right);
      CHECK(types::value_t::numeric == cmp.srcType);
      CHECK(types::value_t::boolean == cmp.dstType);
      CHECK(cmp.srcValue == "1.0");
      CHECK(cmp.dstValue == "false");
      CHECK(compare::MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(!cmp.desc.empty());
      CHECK(cmp.desc.count("result types are different"));
    }

    SECTION("serialize") {
      const auto& value = std::make_shared<types::Number<double>>(1.0);
      const auto& buffer = serialize(value);
      const auto& itype = deserialize(buffer);
      const auto& cmp = value->compare(itype);
      CHECK(types::value_t::numeric == itype->type());
      CHECK(itype->string() == "1.0");
      CHECK(types::value_t::numeric == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "1.0");
      CHECK(cmp.dstValue == "");
      CHECK(compare::MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }
  }

  SECTION("type: string") {
    SECTION("initialize") {
      types::StringType value("some_value");
      CHECK(value.flatten().empty());
      CHECK(value.string() == "some_value");
      CHECK(types::value_t::string == value.type());
    }

    SECTION("compare: match") {
      types::StringType value("some_value");
      const auto& right = std::make_shared<types::StringType>("some_value");
      const auto& cmp = value.compare(right);
      CHECK(types::value_t::string == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "some_value");
      CHECK(cmp.dstValue == "");
      CHECK(compare::MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch value") {
      types::StringType value("some_value");
      const auto& right = std::make_shared<types::StringType>("other_value");
      const auto& cmp = value.compare(right);
      CHECK(types::value_t::string == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "some_value");
      CHECK(cmp.dstValue == "other_value");
      CHECK(compare::MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch type") {
      types::StringType value("some_value");
      const auto& right = std::make_shared<types::BooleanType>(false);
      const auto& cmp = value.compare(right);
      CHECK(types::value_t::string == cmp.srcType);
      CHECK(types::value_t::boolean == cmp.dstType);
      CHECK(cmp.srcValue == "some_value");
      CHECK(cmp.dstValue == "false");
      CHECK(compare::MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.count("result types are different"));
    }

    SECTION("serialize") {
      const auto& value = std::make_shared<types::StringType>("some_value");
      const auto& buffer = serialize(value);
      const auto& itype = deserialize(buffer);
      const auto& cmp = value->compare(itype);
      CHECK(types::value_t::string == itype->type());
      CHECK(itype->string() == "some_value");
      CHECK(types::value_t::string == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "some_value");
      CHECK(cmp.dstValue == "");
      CHECK(compare::MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }
  }

  SECTION("type: array") {
    SECTION("initialize") {
      const auto& element1 = std::make_shared<types::BooleanType>(false);
      types::ArrayType value;
      CHECK(value.flatten().empty());
      CHECK(value.string() == "[]");
      CHECK_NOTHROW(value.add(element1));
      CHECK(value.flatten().count("[0]"));
      CHECK(value.string() == "[false]");
      CHECK(types::value_t::array == value.type());
    }

    SECTION("compare: match: value of type bool") {
      const auto& makeArray = [](const std::vector<bool>& vec) {
        const auto& ret = std::make_shared<types::ArrayType>();
        for (const auto&& v : vec) {
          ret->add(std::make_shared<types::BooleanType>(v));
        }
        return ret;
      };
      const auto& left = makeArray({true, true, true, true});
      const auto& right = makeArray({true, true, true, true});
      const auto& cmp = left->compare(right);

      CHECK(left->flatten().size() == 4ul);
      CHECK(left->string() == "[true,true,true,true]");
      CHECK(right->string() == "[true,true,true,true]");
      CHECK(types::value_t::array == left->type());
      CHECK(types::value_t::array == right->type());
      CHECK(types::value_t::array == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "[true,true,true,true]");
      CHECK(cmp.dstValue == "");
      CHECK(compare::MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: match value of type int") {
      const auto& makeArray = [](const std::vector<int>& vec) {
        const auto& ret = std::make_shared<types::ArrayType>();
        for (const auto& v : vec) {
          ret->add(std::make_shared<types::Number<int64_t>>(v));
        }
        return ret;
      };
      const auto& value = makeArray({41, 42, 43, 44});
      const auto& buffer = serialize(value);
      const auto& itype = deserialize(buffer);
      const auto& cmp = value->compare(itype);

      CHECK(types::value_t::array == itype->type());
      CHECK(itype->string() == R"([41,42,43,44])");
      CHECK(types::value_t::array == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == R"([41,42,43,44])");
      CHECK(cmp.dstValue == "");
      CHECK(compare::MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: match value of type float") {
      const auto& makeArray = [](const std::vector<float>& vec) {
        const auto& ret = std::make_shared<types::ArrayType>();
        for (const auto& v : vec) {
          ret->add(std::make_shared<types::Number<float>>(v));
        }
        return ret;
      };
      const auto& value = makeArray({1.1f, 1.2f, 1.3f, 1.4f});
      const auto& buffer = serialize(value);
      const auto& itype = deserialize(buffer);
      const auto& cmp = value->compare(itype);

      CHECK(types::value_t::array == itype->type());
      CHECK(
          itype->string() ==
          R"([1.100000023841858,1.2000000476837158,1.2999999523162842,1.399999976158142])");
      CHECK(types::value_t::array == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(
          cmp.srcValue ==
          R"([1.100000023841858,1.2000000476837158,1.2999999523162842,1.399999976158142])");
      CHECK(cmp.dstValue == "");
      CHECK(compare::MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: match value of type string") {
      const auto& makeArray = [](const std::vector<std::string>& vec) {
        const auto& ret = std::make_shared<types::ArrayType>();
        for (const auto& v : vec) {
          ret->add(std::make_shared<types::StringType>(v));
        }
        return ret;
      };
      const auto& value = makeArray({"a", "b", "c", "d"});
      const auto& buffer = serialize(value);
      const auto& itype = deserialize(buffer);

      CHECK(types::value_t::array == itype->type());
      CHECK(itype->string() == R"(["a","b","c","d"])");
      const auto& cmp = value->compare(itype);
      CHECK(types::value_t::array == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == R"(["a","b","c","d"])");
      CHECK(cmp.dstValue == "");
      CHECK(compare::MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch value of type bool") {
      const auto& makeArray = [](const std::vector<bool>& vec) {
        const auto& ret = std::make_shared<types::ArrayType>();
        for (const auto&& v : vec) {
          ret->add(std::make_shared<types::BooleanType>(v));
        }
        return ret;
      };
      const auto& left = makeArray({false, true, false, true});
      const auto& right = makeArray({true, false, false, true});
      const auto& cmp = left->compare(right);

      CHECK(left->flatten().size() == 4ul);
      CHECK(left->string() == "[false,true,false,true]");
      CHECK(right->string() == "[true,false,false,true]");
      CHECK(types::value_t::array == left->type());
      CHECK(types::value_t::array == right->type());
      CHECK(types::value_t::array == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "[false,true,false,true]");
      CHECK(cmp.dstValue == "[true,false,false,true]");
      CHECK(compare::MatchType::None == cmp.match);
      CHECK(cmp.score == 0.5);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch value of type int") {
      const auto& makeArray = [](const std::vector<int>& vec) {
        const auto& ret = std::make_shared<types::ArrayType>();
        for (const auto& v : vec) {
          ret->add(std::make_shared<types::Number<int>>(v));
        }
        return ret;
      };
      std::vector<int> elements(20);
      std::iota(elements.begin(), elements.end(), 0);
      const auto& left = makeArray(elements);
      elements[14] = 0;
      const auto& right = makeArray(elements);
      const auto& cmp = left->compare(right);

      CHECK(left->flatten().size() == 20ul);
      CHECK(right->flatten().size() == 20ul);
      CHECK(types::value_t::array == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(compare::MatchType::None == cmp.match);
      CHECK(cmp.score == 0.95);
      CHECK(cmp.desc.size() == 1u);
      CHECK(cmp.desc.count("[5]:value is larger by 14.000000"));
    }

    SECTION("compare: mismatch size") {
      const auto& makeArray = [](const size_t length) {
        const auto& ret = std::make_shared<types::ArrayType>();
        for (auto i = 0u; i < length; i++) {
          ret->add(std::make_shared<types::Number<int>>(1));
        }
        return ret;
      };
      const auto& left = makeArray(4);
      const auto& right = makeArray(6);

      CHECK(left->flatten().size() == 4ul);
      CHECK(right->flatten().size() == 6ul);
      CHECK(left->string() == "[1,1,1,1]");
      CHECK(right->string() == "[1,1,1,1,1,1]");

      const auto& cmp1 = left->compare(right);
      CHECK(types::value_t::array == cmp1.srcType);
      CHECK(types::value_t::unknown == cmp1.dstType);
      CHECK(cmp1.srcValue == "[1,1,1,1]");
      CHECK(cmp1.dstValue == "[1,1,1,1,1,1]");
      CHECK(compare::MatchType::None == cmp1.match);
      CHECK(cmp1.score == 0.0);
      CHECK(cmp1.desc.size() == 1u);
      CHECK(cmp1.desc.count("array size shrunk by 2 elements"));

      const auto& cmp2 = right->compare(left);
      CHECK(types::value_t::array == cmp2.srcType);
      CHECK(types::value_t::unknown == cmp2.dstType);
      CHECK(cmp2.srcValue == "[1,1,1,1,1,1]");
      CHECK(cmp2.dstValue == "[1,1,1,1]");
      CHECK(compare::MatchType::None == cmp2.match);
      CHECK(cmp2.score == 0.0);
      CHECK(cmp2.desc.size() == 1u);
      CHECK(cmp2.desc.count("array size grown by 2 elements"));
    }

    SECTION("serialize") {
      const auto& makeArray = [](const std::vector<bool>& vec) {
        const auto& ret = std::make_shared<types::ArrayType>();
        for (const auto&& v : vec) {
          ret->add(std::make_shared<types::BooleanType>(v));
        }
        return ret;
      };
      const auto& value = makeArray({false, true, false, true});
      const auto& buffer = serialize(value);
      const auto& itype = deserialize(buffer);
      const auto& cmp = value->compare(itype);

      CHECK(types::value_t::array == itype->type());
      CHECK(itype->string() == R"([false,true,false,true])");
      CHECK(types::value_t::array == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == R"([false,true,false,true])");
      CHECK(cmp.dstValue == "");
      CHECK(compare::MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }
  }

  SECTION("type: object") {
    SECTION("initialize: add number to object") {
      types::ObjectType value("creature");
      CHECK(value.flatten().empty());
      CHECK(value.string() == R"({"creature":{}})");
      value.add("number of heads", 1);
      CHECK(value.flatten().count("number of heads"));
      CHECK(value.string() == R"({"creature":{"number of heads":1}})");
      value.add("number of tails", 0);
      CHECK(value.flatten().count("number of tails"));
      CHECK(value.string() ==
            R"({"creature":{"number of heads":1,"number of tails":0}})");
    }

    SECTION("initialize: add object to object") {
      types::ObjectType value("creature");
      CHECK(value.flatten().empty());
      creature::Head head1(2);
      value.add("first_head", head1);
      CHECK(value.flatten().count("first_head.eyes"));
      CHECK(value.string() ==
            R"({"creature":{"first_head":{"head":{"eyes":2}}}})");
    }

    SECTION("compare: match") {
      types::ObjectType value("creature");
      value.add("first_head", creature::Head(2));
      auto right = std::make_shared<types::ObjectType>("some_other_creature");
      right->add("first_head", creature::Head(2));
      const auto& cmp = value.compare(right);

      CHECK(types::value_t::object == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue ==
            R"({"creature":{"first_head":{"head":{"eyes":2}}}})");
      CHECK(cmp.dstValue == R"()");
      CHECK(compare::MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch value") {
      types::ObjectType value("creature");
      value.add("first_head", creature::Head(2));
      auto right = std::make_shared<types::ObjectType>("some_other_creature");
      right->add("first_head", creature::Head(3));
      const auto& cmp = value.compare(right);

      CHECK(types::value_t::object == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue ==
            R"({"creature":{"first_head":{"head":{"eyes":2}}}})");
      CHECK(cmp.dstValue ==
            R"({"some_other_creature":{"first_head":{"head":{"eyes":3}}}})");
      CHECK(compare::MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.size() == 1u);
      CHECK(cmp.desc.count("first_head.eyes: value is smaller by 1.000000"));
    }

    SECTION("serialize") {
      const auto& value = std::make_shared<types::ObjectType>("creature");
      value->add("first_head", creature::Head(2));
      const auto& buffer = serialize(value);
      const auto& itype = deserialize(buffer);
      const auto& expected =
          R"({"creature":{"first_head":{"head":{"eyes":2}}}})";
      const auto& cmp = value->compare(itype);

      CHECK(types::value_t::object == itype->type());
      CHECK(itype->string() == expected);
      CHECK(types::value_t::object == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(cmp.srcValue == expected);
      CHECK(cmp.dstValue == "");
      CHECK(compare::MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("initialize: array of objects") {
      using type_t = std::vector<creature::Head>;
      const auto& make = [](const std::vector<int>& vec) {
        type_t inputs;
        for (const auto& v : vec) {
          inputs.emplace_back(v);
        }
        return converter<type_t>().convert(inputs);
      };
      const auto& left = make({1, 3, 4, 1, 0});
      const auto& right = make({1, 3, 4, 0, 1});
      const auto& cmp = left->compare(right);

      CHECK(
          left->string() ==
          R"([{"head":{"eyes":1}},{"head":{"eyes":3}},{"head":{"eyes":4}},{"head":{"eyes":1}},{"head":{"eyes":0}}])");
      CHECK(left->flatten().size() == 5ul);
      CHECK(left->flatten().count("[2]eyes"));
      CHECK(left->flatten().at("[2]eyes")->string() == R"(4)");
      CHECK(compare::MatchType::None == cmp.match);
      CHECK(cmp.score == 0.6);
    }
  }

  SECTION("type: standard") {
    SECTION("std::pair") {
      using type_t = std::pair<bool, bool>;
      const type_t value(true, false);
      const auto& expected = R"({"std::pair":{"first":true,"second":false}})";

      SECTION("initialize") {
        const auto& itype = converter<type_t>().convert(value);
        CHECK(types::value_t::object == itype->type());
        CHECK(itype->string() == expected);
        CHECK_FALSE(itype->flatten().empty());
        CHECK(itype->flatten().count("first"));
        CHECK(itype->flatten().at("first")->string() == R"(true)");
      }

      SECTION("compare") {
        const type_t leftValue(true, false);
        const type_t rightValue(false, false);
        const auto& left = converter<type_t>().convert(leftValue);
        const auto& right = converter<type_t>().convert(rightValue);
        const auto& cmp = left->compare(right);
        CHECK(types::value_t::object == cmp.srcType);
        CHECK(types::value_t::unknown == cmp.dstType);
        CHECK(cmp.srcValue == expected);
        CHECK(cmp.dstValue ==
              R"({"std::pair":{"first":false,"second":false}})");
        CHECK(compare::MatchType::None == cmp.match);
        CHECK(cmp.score == 0.5);
        CHECK(cmp.desc.empty());
      }
    }

    SECTION("std::vector of pair") {
      using type_t = std::vector<std::pair<std::wstring, std::wstring>>;
      const type_t leftValue{{L"k1", L"v1"}, {L"k2", L"v2"}};
      const type_t rightValue{{L"k1", L"v1"}, {L"k2", L"v2"}};
      const auto& left = converter<type_t>().convert(leftValue);
      const auto& right = converter<type_t>().convert(rightValue);
      const auto& cmp = left->compare(right);

      CHECK(types::value_t::array == cmp.srcType);
      CHECK(types::value_t::unknown == cmp.dstType);
      CHECK(
          cmp.srcValue ==
          R"([{"std::pair":{"first":"k1","second":"v1"}},{"std::pair":{"first":"k2","second":"v2"}}])");
      CHECK(compare::MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("std::shared_ptr") {
      using type_t = std::shared_ptr<bool>;

      SECTION("initialize") {
        const auto& value = std::make_shared<bool>(true);
        const auto& itype = converter<type_t>().convert(value);
        CHECK(types::value_t::object == itype->type());
        CHECK(itype->string() == R"({"std::shared_ptr":{"v":true}})");
        CHECK_FALSE(itype->flatten().empty());
        CHECK(itype->flatten().count("v"));
        CHECK(itype->flatten().at("v")->string() == R"(true)");
      }

      SECTION("initialize: null") {
        const type_t value;
        const auto& itype = converter<type_t>().convert(value);
        CHECK(types::value_t::object == itype->type());
        CHECK(itype->string() == R"({"std::shared_ptr":{}})");
        CHECK(itype->flatten().empty());
      }

      SECTION("compare: mismatch") {
        const auto& leftValue = std::make_shared<bool>(true);
        const auto& rightValue = std::make_shared<bool>(false);
        const auto& left = converter<type_t>().convert(leftValue);
        const auto& right = converter<type_t>().convert(rightValue);
        const auto& cmp = left->compare(right);

        CHECK(compare::MatchType::None == cmp.match);
        CHECK(cmp.score == 0.0);
        CHECK(types::value_t::object == cmp.srcType);
        CHECK(types::value_t::unknown == cmp.dstType);
        CHECK(cmp.srcValue == R"({"std::shared_ptr":{"v":true}})");
        CHECK(cmp.dstValue == R"({"std::shared_ptr":{"v":false}})");
        CHECK(cmp.desc.empty());
      }
    }

    SECTION("std::map") {
      using type_t = std::map<unsigned int, bool>;
      type_t value = {{1u, true}, {2u, false}};
      const auto& itype = converter<type_t>().convert(value);

      CHECK(types::value_t::array == itype->type());
      CHECK(
          itype->string() ==
          R"([{"std::pair":{"first":1,"second":true}},{"std::pair":{"first":2,"second":false}}])");
      CHECK(itype->flatten().size() == 4u);
      CHECK(itype->flatten().count("[0]first"));
      CHECK(itype->flatten().count("[0]second"));
      CHECK(itype->flatten().count("[1]first"));
      CHECK(itype->flatten().count("[1]second"));
      CHECK(itype->flatten().at("[0]first")->string() == R"(1)");
      CHECK(itype->flatten().at("[0]second")->string() == R"(true)");
      CHECK(itype->flatten().at("[1]first")->string() == R"(2)");
      CHECK(itype->flatten().at("[1]second")->string() == R"(false)");
    }
  }
}
