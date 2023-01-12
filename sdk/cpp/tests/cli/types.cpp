// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/core/types.hpp"

#include <numeric>

#include "catch2/catch.hpp"
#include "tests/core/shared.hpp"
#include "touca/core/comparison.hpp"
#include "touca/impl/schema.hpp"

using touca::detail::internal_type;

TEST_CASE("Simple Data Types") {
  using namespace touca;

  SECTION("type: null") {
    auto value = data_point::null();
    SECTION("initialize") {
      CHECK(value.to_string() == "null");
      CHECK(internal_type::null == value.type());
    }
  }

  SECTION("type: bool") {
    const auto& value = data_point::boolean(true);

    SECTION("initialize") {
      CHECK(value.to_string() == "true");
      CHECK(internal_type::boolean == value.type());
    }

    SECTION("compare: match") {
      const auto& right = data_point::boolean(true);
      const auto& cmp = compare(value, right);
      CHECK(internal_type::boolean == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "true");
      CHECK(cmp.dstValue == "");
      CHECK(MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch value") {
      const auto& right = data_point::boolean(false);
      const auto& cmp = compare(value, right);
      CHECK(internal_type::boolean == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "true");
      CHECK(cmp.dstValue == "false");
      CHECK(MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch type") {
      const auto& right = data_point::string("true");
      const auto& cmp = compare(value, right);
      CHECK(internal_type::boolean == cmp.srcType);
      CHECK(internal_type::string == cmp.dstType);
      CHECK(cmp.srcValue == "true");
      CHECK(cmp.dstValue == "true");
      CHECK(MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.size() == 1u);
      CHECK(cmp.desc.count("result types are different"));
    }
  }

  SECTION("type: number integer") {
    SECTION("initialize") {
      const auto& value = data_point::number_signed(42);
      CHECK(value.to_string() == "42");
      CHECK(internal_type::number_signed == value.type());
    }

    SECTION("compare: match") {
      const auto& value = data_point::number_signed(42);
      const auto& right = data_point::number_signed(42);
      const auto& cmp = compare(value, right);
      CHECK(internal_type::number_signed == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "42");
      CHECK(cmp.dstValue == "");
      CHECK(MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch: smaller") {
      const auto& value = data_point::number_signed(5);
      const auto& right = data_point::number_signed(10);
      const auto& cmp = compare(value, right);
      CHECK(internal_type::number_signed == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "5");
      CHECK(cmp.dstValue == "10");
      CHECK(MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.size() == 1u);
      CHECK(cmp.desc.count("value is smaller by 5.000000"));
    }

    SECTION("compare: mismatch: percent") {
      const auto& value = data_point::number_signed(12);
      const auto& right = data_point::number_signed(10);
      const auto& cmp = compare(value, right);
      CHECK(internal_type::number_signed == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "12");
      CHECK(cmp.dstValue == "10");
      CHECK(MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.size() == 1u);
      CHECK(cmp.desc.count("value is larger by 20.000000 percent"));
    }

    SECTION("compare: mismatch type") {
      const auto& value = data_point::number_signed(42);
      const auto& right = data_point::boolean(false);
      const auto& cmp = compare(value, right);
      CHECK(internal_type::number_signed == cmp.srcType);
      CHECK(internal_type::boolean == cmp.dstType);
      CHECK(cmp.srcValue == "42");
      CHECK(cmp.dstValue == "false");
      CHECK(MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.size() == 1u);
      CHECK(cmp.desc.count("result types are different"));
    }
  }

  SECTION("type: double") {
    SECTION("initialize") {
      const auto& value = data_point::number_double(0.0);
      CHECK(value.to_string() == "0.0");
      CHECK(internal_type::number_double == value.type());
    }

    SECTION("match") {
      const auto& value = data_point::number_double(1.0);
      const auto& right = data_point::number_double(1.0);
      const auto& cmp = compare(value, right);
      CHECK(internal_type::number_double == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "1.0");
      CHECK(cmp.dstValue == "");
      CHECK(MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch value") {
      const auto& value = data_point::number_double(0.0);
      const auto& right = data_point::number_double(1.0);
      const auto& cmp = compare(value, right);
      CHECK(internal_type::number_double == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "0.0");
      CHECK(cmp.dstValue == "1.0");
      CHECK(MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.size() == 1u);
      CHECK(cmp.desc.count("value is smaller by 1.000000"));
    }

    SECTION("compare: mismatch value: percent") {
      const auto& value = data_point::number_double(1.1);
      const auto& right = data_point::number_double(1.0);
      const auto& cmp = compare(value, right);
      CHECK(internal_type::number_double == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "1.1");
      CHECK(cmp.dstValue == "1.0");
      CHECK(MatchType::None == cmp.match);
      CHECK(cmp.score == Approx(0.9));
      CHECK(cmp.desc.size() == 1u);
      CHECK(cmp.desc.count("value is larger by 10.000000 percent"));
    }

    SECTION("compare: mismatch type") {
      const auto& value = data_point::number_double(1.0);
      const auto& right = data_point::boolean(false);
      const auto& cmp = compare(value, right);
      CHECK(internal_type::number_double == cmp.srcType);
      CHECK(internal_type::boolean == cmp.dstType);
      CHECK(cmp.srcValue == "1.0");
      CHECK(cmp.dstValue == "false");
      CHECK(MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(!cmp.desc.empty());
      CHECK(cmp.desc.count("result types are different"));
    }
  }

  SECTION("type: string") {
    SECTION("initialize") {
      const auto& value = data_point::string("some_value");
      CHECK(value.to_string() == "some_value");
      CHECK(internal_type::string == value.type());
    }

    SECTION("compare: match") {
      const auto& value = data_point::string("some_value");
      const auto& right = data_point::string("some_value");
      const auto& cmp = compare(value, right);
      CHECK(internal_type::string == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "some_value");
      CHECK(cmp.dstValue == "");
      CHECK(MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch value") {
      const auto& value = data_point::string("some_value");
      const auto& right = data_point::string("other_value");
      const auto& cmp = compare(value, right);
      CHECK(internal_type::string == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "some_value");
      CHECK(cmp.dstValue == "other_value");
      CHECK(MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch type") {
      const auto& value = data_point::string("some_value");
      const auto& right = data_point::boolean(false);
      const auto& cmp = compare(value, right);
      CHECK(internal_type::string == cmp.srcType);
      CHECK(internal_type::boolean == cmp.dstType);
      CHECK(cmp.srcValue == "some_value");
      CHECK(cmp.dstValue == "false");
      CHECK(MatchType::None == cmp.match);
      CHECK(cmp.score == 0.0);
      CHECK(cmp.desc.count("result types are different"));
    }
  }

  SECTION("type: array") {
    SECTION("initialize") {
      const auto& value = data_point(array());
      CHECK(value.to_string() == "[]");
      CHECK_NOTHROW(value.as_array()->push_back(data_point::boolean(false)));
      CHECK(value.to_string() == "[false]");
      CHECK(internal_type::array == value.type());
    }

    SECTION("compare: match: value of type bool") {
      const auto& makeArray = [](const std::vector<bool>& vec) -> data_point {
        touca::array ret;
        for (const auto&& v : vec) {
          ret.add(data_point::boolean(v));
        }
        return ret;
      };
      const auto& left = makeArray({true, true, true, true});
      const auto& right = makeArray({true, true, true, true});
      const auto& cmp = compare(left, right);

      CHECK(flatten(left).size() == 4ul);
      CHECK(left.to_string() == "[true,true,true,true]");
      CHECK(right.to_string() == "[true,true,true,true]");
      CHECK(internal_type::array == left.type());
      CHECK(internal_type::array == right.type());
      CHECK(internal_type::array == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "[true,true,true,true]");
      CHECK(cmp.dstValue == "");
      CHECK(MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch value of type bool") {
      const auto& makeArray = [](const std::vector<bool>& vec) -> data_point {
        touca::array ret;
        for (const auto&& v : vec) {
          ret.add(serializer<bool>().serialize(v));
        }
        return ret;
      };
      const auto& left = makeArray({false, true, false, true});
      const auto& right = makeArray({true, false, false, true});
      const auto& cmp = compare(left, right);

      CHECK(flatten(left).size() == 4ul);
      CHECK(left.to_string() == "[false,true,false,true]");
      CHECK(right.to_string() == "[true,false,false,true]");
      CHECK(internal_type::array == left.type());
      CHECK(internal_type::array == right.type());
      CHECK(internal_type::array == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(cmp.srcValue == "[false,true,false,true]");
      CHECK(cmp.dstValue == "[true,false,false,true]");
      CHECK(MatchType::None == cmp.match);
      CHECK(cmp.score == 0.5);
      CHECK(cmp.desc.empty());
    }

    SECTION("compare: mismatch value of type int") {
      const auto& makeArray = [](const std::vector<int>& vec) -> data_point {
        touca::array ret;
        for (const auto& v : vec) {
          ret.add(v);
        }
        return ret;
      };
      std::vector<int> elements(20);
      std::iota(elements.begin(), elements.end(), 0);
      const auto& left = makeArray(elements);
      elements[14] = 0;
      const auto& right = makeArray(elements);
      const auto& cmp = compare(left, right);

      CHECK(flatten(left).size() == 20ul);
      CHECK(flatten(right).size() == 20ul);
      CHECK(internal_type::array == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(MatchType::None == cmp.match);
      CHECK(cmp.score == 0.95);
      CHECK(cmp.desc.size() == 1u);
      CHECK(cmp.desc.count("[5]:value is larger by 14.000000"));
    }

    SECTION("compare: mismatch size") {
      const auto& makeArray = [](const size_t length) -> data_point {
        touca::array ret;
        for (auto i = 0u; i < length; i++) {
          ret.add(1);
        }
        return ret;
      };
      const auto& left = makeArray(4);
      const auto& right = makeArray(6);

      CHECK(flatten(left).size() == 4ul);
      CHECK(flatten(right).size() == 6ul);
      CHECK(left.to_string() == "[1,1,1,1]");
      CHECK(right.to_string() == "[1,1,1,1,1,1]");

      const auto& cmp1 = compare(left, right);
      CHECK(internal_type::array == cmp1.srcType);
      CHECK(internal_type::unknown == cmp1.dstType);
      CHECK(cmp1.srcValue == "[1,1,1,1]");
      CHECK(cmp1.dstValue == "[1,1,1,1,1,1]");
      CHECK(MatchType::None == cmp1.match);
      CHECK(cmp1.score == 0.0);
      CHECK(cmp1.desc.size() == 1u);
      CHECK(cmp1.desc.count("array size shrunk by 2 elements"));

      const auto& cmp2 = compare(right, left);
      CHECK(internal_type::array == cmp2.srcType);
      CHECK(internal_type::unknown == cmp2.dstType);
      CHECK(cmp2.srcValue == "[1,1,1,1,1,1]");
      CHECK(cmp2.dstValue == "[1,1,1,1]");
      CHECK(MatchType::None == cmp2.match);
      CHECK(cmp2.score == 0.0);
      CHECK(cmp2.desc.size() == 1u);
      CHECK(cmp2.desc.count("array size grown by 2 elements"));
    }
  }

  SECTION("type: object") {
    SECTION("initialize: array of objects") {
      using type_t = std::vector<Head>;
      const auto& make = [](const std::vector<int>& vec) {
        type_t inputs;
        for (const auto& v : vec) {
          inputs.emplace_back(v);
        }
        return serializer<type_t>().serialize(inputs);
      };
      const auto& left = make({1, 3, 4, 1, 0});
      const auto& right = make({1, 3, 4, 0, 1});
      const auto& cmp = compare(left, right);

      CHECK(
          left.to_string() ==
          R"([{"head":{"eyes":1}},{"head":{"eyes":3}},{"head":{"eyes":4}},{"head":{"eyes":1}},{"head":{"eyes":0}}])");
      CHECK(flatten(left).size() == 5ul);
      CHECK(flatten(left).count("[2]eyes"));
      CHECK(flatten(left).at("[2]eyes").to_string() == R"(4)");
      CHECK(MatchType::None == cmp.match);
      CHECK(cmp.score == 0.6);
    }
  }

  SECTION("type: standard") {
    SECTION("std::pair") {
      using type_t = std::pair<bool, bool>;
      const type_t value(true, false);
      const auto& expected = R"({"std::pair":{"first":true,"second":false}})";

      SECTION("initialize") {
        const auto& itype = serializer<type_t>().serialize(value);
        CHECK(internal_type::object == itype.type());
        CHECK(itype.to_string() == expected);
        CHECK_FALSE(flatten(itype).empty());
        CHECK(flatten(itype).count("first"));
        CHECK(flatten(itype).at("first").to_string() == R"(true)");
      }

      SECTION("compare") {
        const type_t leftValue(true, false);
        const type_t rightValue(false, false);
        const auto& left = serializer<type_t>().serialize(leftValue);
        const auto& right = serializer<type_t>().serialize(rightValue);
        const auto& cmp = compare(left, right);
        CHECK(internal_type::object == cmp.srcType);
        CHECK(internal_type::unknown == cmp.dstType);
        CHECK(cmp.srcValue == expected);
        CHECK(cmp.dstValue ==
              R"({"std::pair":{"first":false,"second":false}})");
        CHECK(MatchType::None == cmp.match);
        CHECK(cmp.score == 0.5);
        CHECK(cmp.desc.empty());
      }
    }

    SECTION("std::vector of pair") {
      using type_t = std::vector<std::pair<std::wstring, std::wstring>>;
      const type_t leftValue{{L"k1", L"v1"}, {L"k2", L"v2"}};
      const type_t rightValue{{L"k1", L"v1"}, {L"k2", L"v2"}};
      const auto& left = serializer<type_t>().serialize(leftValue);
      const auto& right = serializer<type_t>().serialize(rightValue);
      const auto& cmp = compare(left, right);

      CHECK(internal_type::array == cmp.srcType);
      CHECK(internal_type::unknown == cmp.dstType);
      CHECK(
          cmp.srcValue ==
          R"([{"std::pair":{"first":"k1","second":"v1"}},{"std::pair":{"first":"k2","second":"v2"}}])");
      CHECK(MatchType::Perfect == cmp.match);
      CHECK(cmp.score == 1.0);
      CHECK(cmp.desc.empty());
    }

    SECTION("std::shared_ptr") {
      using type_t = std::shared_ptr<bool>;

      SECTION("initialize") {
        const auto& value = std::make_shared<bool>(true);
        const auto& itype = serializer<type_t>().serialize(value);
        CHECK(internal_type::object == itype.type());
        CHECK(itype.to_string() == R"({"std::shared_ptr":{"v":true}})");
        CHECK_FALSE(flatten(itype).empty());
        CHECK(flatten(itype).count("v"));
        CHECK(flatten(itype).at("v").to_string() == R"(true)");
      }

      SECTION("initialize: null") {
        const type_t value;
        const auto& itype = serializer<type_t>().serialize(value);
        CHECK(internal_type::object == itype.type());
        CHECK(itype.to_string() == R"({"std::shared_ptr":{}})");
        CHECK(flatten(itype).empty());
      }

      SECTION("compare: mismatch") {
        const auto& leftValue = std::make_shared<bool>(true);
        const auto& rightValue = std::make_shared<bool>(false);
        const auto& left = serializer<type_t>().serialize(leftValue);
        const auto& right = serializer<type_t>().serialize(rightValue);
        const auto& cmp = compare(left, right);

        CHECK(MatchType::None == cmp.match);
        CHECK(cmp.score == 0.0);
        CHECK(internal_type::object == cmp.srcType);
        CHECK(internal_type::unknown == cmp.dstType);
        CHECK(cmp.srcValue == R"({"std::shared_ptr":{"v":true}})");
        CHECK(cmp.dstValue == R"({"std::shared_ptr":{"v":false}})");
        CHECK(cmp.desc.empty());
      }
    }

    SECTION("std::map") {
      using type_t = std::map<unsigned int, bool>;
      type_t value = {{1u, true}, {2u, false}};
      const auto& itype = serializer<type_t>().serialize(value);

      CHECK(internal_type::array == itype.type());
      CHECK(
          itype.to_string() ==
          R"([{"std::pair":{"first":1,"second":true}},{"std::pair":{"first":2,"second":false}}])");
      CHECK(flatten(itype).size() == 4u);
      CHECK(flatten(itype).count("[0]first"));
      CHECK(flatten(itype).count("[0]second"));
      CHECK(flatten(itype).count("[1]first"));
      CHECK(flatten(itype).count("[1]second"));
      CHECK(flatten(itype).at("[0]first").to_string() == R"(1)");
      CHECK(flatten(itype).at("[0]second").to_string() == R"(true)");
      CHECK(flatten(itype).at("[1]first").to_string() == R"(2)");
      CHECK(flatten(itype).at("[1]second").to_string() == R"(false)");
    }
  }
}
