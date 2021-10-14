// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/core/types.hpp"

#include <cmath>

#include "flatbuffers/flatbuffers.h"
#include "fmt/format.h"
#include "nlohmann/json.hpp"
#include "touca/core/convert.hpp"
#include "touca/core/object.hpp"
#include "touca/devkit/comparison.hpp"
#include "touca/impl/schema.hpp"

namespace touca {
namespace detail {

template <typename T>
typename std::enable_if<
    touca::detail::is_touca_number<T>::value &&
        std::is_same<float, typename std::remove_cv<T>::type>::value,
    std::pair<flatbuffers::Offset<void>, touca::fbs::Type>>::type
serialize_number(const T& value, flatbuffers::FlatBufferBuilder& builder) {
  touca::fbs::FloatBuilder fbsNumber_builder(builder);
  fbsNumber_builder.add_value(value);
  const auto& fbsNumber = fbsNumber_builder.Finish();

  std::pair<flatbuffers::Offset<void>, touca::fbs::Type> buffer;
  buffer.first = fbsNumber.Union();
  buffer.second = touca::fbs::Type::Float;
  return buffer;
}

template <typename T>
typename std::enable_if<
    touca::detail::is_touca_number<T>::value &&
        std::is_same<double, typename std::remove_cv<T>::type>::value,
    std::pair<flatbuffers::Offset<void>, touca::fbs::Type>>::type
serialize_number(const T& value, flatbuffers::FlatBufferBuilder& builder) {
  touca::fbs::DoubleBuilder fbsNumber_builder(builder);
  fbsNumber_builder.add_value(value);
  const auto& fbsNumber = fbsNumber_builder.Finish();

  std::pair<flatbuffers::Offset<void>, touca::fbs::Type> buffer;
  buffer.first = fbsNumber.Union();
  buffer.second = touca::fbs::Type::Double;
  return buffer;
}

template <typename T>
typename std::enable_if<
    touca::detail::is_touca_number<T>::value &&
        !std::is_floating_point<T>::value && std::is_signed<T>::value,
    std::pair<flatbuffers::Offset<void>, touca::fbs::Type>>::type
serialize_number(const T& value, flatbuffers::FlatBufferBuilder& builder) {
  touca::fbs::IntBuilder fbsNumber_builder(builder);
  fbsNumber_builder.add_value(value);
  const auto& fbsNumber = fbsNumber_builder.Finish();

  std::pair<flatbuffers::Offset<void>, touca::fbs::Type> buffer;
  buffer.first = fbsNumber.Union();
  buffer.second = touca::fbs::Type::Int;
  return buffer;
}

template <typename T>
typename std::enable_if<
    touca::detail::is_touca_number<T>::value &&
        !std::is_floating_point<T>::value && !std::is_signed<T>::value,
    std::pair<flatbuffers::Offset<void>, touca::fbs::Type>>::type
serialize_number(const T& value, flatbuffers::FlatBufferBuilder& builder) {
  touca::fbs::UIntBuilder fbsNumber_builder(builder);
  fbsNumber_builder.add_value(value);
  const auto& fbsNumber = fbsNumber_builder.Finish();

  std::pair<flatbuffers::Offset<void>, touca::fbs::Type> buffer;
  buffer.first = fbsNumber.Union();
  buffer.second = touca::fbs::Type::UInt;
  return buffer;
}

}  // namespace detail

namespace types {

value_t IType::type() const { return _type_t; }

std::string IType::string() const {
  const auto& element = json();
  return element.type() == nlohmann::json::value_t::string
             ? element.get<std::string>()
             : element.dump();
}

NoneType::NoneType() : IType(value_t::null) {}

nlohmann::ordered_json NoneType::json() const {
  return nlohmann::json::object();
}

flatbuffers::Offset<fbs::TypeWrapper> NoneType::serialize(
    flatbuffers::FlatBufferBuilder& builder) const {
  return BooleanType(false).serialize(builder);
}

TypeComparison NoneType::compare(const std::shared_ptr<IType>& itype) const {
  return BooleanType(false).compare(itype);
}

BooleanType::BooleanType(bool value) : IType(value_t::boolean), _value(value) {}

nlohmann::ordered_json BooleanType::json() const { return _value; }

flatbuffers::Offset<fbs::TypeWrapper> BooleanType::serialize(
    flatbuffers::FlatBufferBuilder& builder) const {
  fbs::BoolBuilder bool_builder(builder);
  bool_builder.add_value(_value);
  const auto& fbsValue = bool_builder.Finish();
  fbs::TypeWrapperBuilder typeWrapper_builder(builder);
  typeWrapper_builder.add_value(fbsValue.Union());
  typeWrapper_builder.add_value_type(fbs::Type::Bool);
  return typeWrapper_builder.Finish();
}

TypeComparison BooleanType::compare(const std::shared_ptr<IType>& itype) const {
  TypeComparison result;
  result.srcType = _type_t;
  result.srcValue = string();

  // the two result keys are considered completely different
  // if they are different in types.

  if (_type_t != itype->type()) {
    result.dstType = itype->type();
    result.dstValue = itype->string();
    result.desc.insert("result types are different");
    return result;
  }

  // two Bool objects are equal if they have identical values.

  const auto dst = std::dynamic_pointer_cast<BooleanType>(itype);
  if (_value == dst->_value) {
    result.match = MatchType::Perfect;
    result.score = 1.0;
    return result;
  }

  result.dstValue = itype->string();

  return result;
}

template <class T>
NumberType<T>::NumberType(T value) : IType(value_t::numeric), _value(value) {}

template <class T>
nlohmann::ordered_json NumberType<T>::json() const {
  return _value;
}

template <class T>
T NumberType<T>::value() const {
  return _value;
}

template <class T>
flatbuffers::Offset<fbs::TypeWrapper> NumberType<T>::serialize(
    flatbuffers::FlatBufferBuilder& fbb) const {
  const auto& buffer = detail::serialize_number<T>(_value, fbb);
  fbs::TypeWrapperBuilder fbsTypeWrapper_builder(fbb);
  fbsTypeWrapper_builder.add_value(buffer.first);
  fbsTypeWrapper_builder.add_value_type(buffer.second);
  return fbsTypeWrapper_builder.Finish();
}

template <class T>
TypeComparison NumberType<T>::compare(
    const std::shared_ptr<IType>& itype) const {
  TypeComparison result;
  result.srcType = _type_t;
  result.srcValue = string();

  // the two result keys are considered completely different
  // if they are different in types.

  if (_type_t != itype->type()) {
    result.dstType = itype->type();
    result.dstValue = itype->string();
    result.desc.insert("result types are different");
    return result;
  }

  // two Number objects are equal if their numeric value is equal
  // in their original type.

  const auto dst = std::dynamic_pointer_cast<NumberType<T>>(itype);
  if (_value == dst->_value) {
    result.match = MatchType::Perfect;
    result.score = 1.0;
    return result;
  }

  result.dstValue = itype->string();

  const auto threshold = 0.2;
  const auto srcValue = static_cast<double>(_value);
  const auto dstValue = static_cast<double>(dst->_value);
  const auto diff = srcValue - dstValue;
  const auto percent = 0.0 == dstValue ? 0.0 : std::fabs(diff / dstValue);
  const auto& difference = 0.0 == percent || threshold < percent
                               ? std::to_string(std::fabs(diff))
                               : std::to_string(percent * 100.0) + " percent";
  if (0.0 < percent && percent < threshold) {
    result.score = 1.0 - percent;
  }

  const std::string direction = 0 < diff ? "larger" : "smaller";
  result.desc.insert("value is " + direction + " by " + difference);
  return result;
}

StringType::StringType(const std::string& value)
    : IType(value_t::string), _value(value) {}

nlohmann::ordered_json StringType::json() const { return _value; }

flatbuffers::Offset<fbs::TypeWrapper> StringType::serialize(
    flatbuffers::FlatBufferBuilder& builder) const {
  const auto& fbsStringValue = builder.CreateString(_value);
  fbs::StringBuilder string_builder(builder);
  string_builder.add_value(fbsStringValue);
  const auto& fbsValue = string_builder.Finish();
  fbs::TypeWrapperBuilder typeWrapper_builder(builder);
  typeWrapper_builder.add_value(fbsValue.Union());
  typeWrapper_builder.add_value_type(fbs::Type::String);
  return typeWrapper_builder.Finish();
}

TypeComparison StringType::compare(const std::shared_ptr<IType>& itype) const {
  TypeComparison result;
  result.srcType = _type_t;
  result.srcValue = string();

  // the two result keys are considered completely different
  // if they are different in types.

  if (_type_t != itype->type()) {
    result.dstType = itype->type();
    result.dstValue = itype->string();
    result.desc.insert("result types are different");
    return result;
  }

  // two String objects are equal if they have identical values

  const auto dst = std::dynamic_pointer_cast<StringType>(itype);
  if (0 == _value.compare(dst->_value)) {
    result.match = MatchType::Perfect;
    result.score = 1.0;
    return result;
  }

  result.dstValue = itype->string();

  return result;
}

ArrayType::ArrayType() : IType(value_t::array) {}

nlohmann::ordered_json ArrayType::json() const {
  nlohmann::ordered_json out = nlohmann::json::array();
  for (const auto& v : _values) {
    out.push_back(v->json());
  }
  return out;
}

flatbuffers::Offset<fbs::TypeWrapper> ArrayType::serialize(
    flatbuffers::FlatBufferBuilder& builder) const {
  std::vector<flatbuffers::Offset<fbs::TypeWrapper>> fbsEntries_vector;
  for (const auto& value : _values) {
    fbsEntries_vector.push_back(value->serialize(builder));
  }
  const auto& fbsEntries = builder.CreateVector(fbsEntries_vector);
  fbs::ArrayBuilder fbsArray_builder(builder);
  fbsArray_builder.add_values(fbsEntries);
  const auto& fbsValue = fbsArray_builder.Finish();
  fbs::TypeWrapperBuilder typeWrapper_builder(builder);
  typeWrapper_builder.add_value(fbsValue.Union());
  typeWrapper_builder.add_value_type(fbs::Type::Array);
  return typeWrapper_builder.Finish();
}

void ArrayType::add(const std::shared_ptr<types::IType>& value) {
  _values.push_back(value);
}

TypeComparison ArrayType::compare(const std::shared_ptr<IType>& itype) const {
  TypeComparison result;
  result.srcType = _type_t;
  result.srcValue = string();

  // the two result keys are considered completely different
  // if they are different in types.

  if (_type_t != itype->type()) {
    result.dstType = itype->type();
    result.dstValue = itype->string();
    result.desc.insert("result types are different");
    return result;
  }

  // helper function to get flattened list of elements of an Array
  // object.
  const auto get_flattened = [](const ArrayType& arr) {
    const auto kvps = arr.flatten();
    std::vector<std::shared_ptr<IType>> items;
    items.reserve(kvps.size());
    for (const auto& kvp : kvps) {
      items.emplace_back(kvp.second);
    }
    return items;
  };

  const auto dst = std::dynamic_pointer_cast<ArrayType>(itype);
  const auto srcMembers = get_flattened(*this);
  const auto dstMembers = get_flattened(*dst);

  const std::pair<size_t, size_t> minmax =
      std::minmax(srcMembers.size(), dstMembers.size());

  // if the two result keys are both empty arrays, we consider them
  // identical. we choose to handle this special case to prevent
  // divide by zero.

  if (0u == minmax.second) {
    result.match = MatchType::Perfect;
    result.score = 1.0;
    return result;
  }

  // skip element-wise comparison if array has changed in size and
  // the change of size is more than the threshold that determines
  // if element-wise comparison information is helpful to user.

  const auto sizeThreshold = 0.2;
  const auto diffRange = minmax.second - minmax.first;
  const auto sizeRatio = diffRange / static_cast<double>(minmax.second);
  // describe the change of array size
  if (0 != diffRange) {
    const auto& change =
        srcMembers.size() < dstMembers.size() ? "shrunk" : "grown";
    result.desc.insert(
        fmt::format("array size {} by {} elements", change, diffRange));
  }
  // skip if array size has changed noticeably or if array in head
  // version is empty.
  if (sizeThreshold < sizeRatio || srcMembers.empty()) {
    // keep result.match as None and score as 0.0
    // and return the comparison result
    result.dstValue = itype->string();
    return result;
  }

  // perform element-wise comparison
  auto scoreEarned = 0.0;
  std::unordered_map<unsigned, std::set<std::string>> differences;

  for (auto i = 0u; i < minmax.first; i++) {
    const auto tmp = srcMembers.at(i)->compare(dstMembers.at(i));
    scoreEarned += tmp.score;
    if (MatchType::None == tmp.match) {
      differences.emplace(i, tmp.desc);
    }
  }

  // we will only report element-wise differences if the number of
  // different elements does not exceed our threshold that determines
  // if this information is helpful to user.
  const auto diffRatioThreshold = 0.2;
  const auto diffSizeThreshold = 10u;
  const auto diffRatio =
      differences.size() / static_cast<double>(srcMembers.size());
  if (diffRatio < diffRatioThreshold ||
      differences.size() < diffSizeThreshold) {
    for (const auto& diff : differences) {
      for (const auto& msg : diff.second) {
        result.desc.insert(fmt::format("[{}]:{}", diff.first, msg));
      }
    }
    result.score = scoreEarned / minmax.second;
  }

  if (1.0 == result.score) {
    result.match = MatchType::Perfect;
    return result;
  }

  result.dstValue = itype->string();
  return result;
}

KeyMap ArrayType::flatten() const {
  KeyMap members;
  for (unsigned i = 0; i < _values.size(); ++i) {
    const auto& value = _values.at(i);
    const auto& name = '[' + std::to_string(i) + ']';
    const auto& nestedMembers = value->flatten();
    if (nestedMembers.empty()) {
      members.emplace(name, value);
      continue;
    }
    for (const auto& nestedMember : nestedMembers) {
      const auto& key = name + nestedMember.first;
      members.emplace(key, nestedMember.second);
    }
  }
  return members;
}

template class NumberType<float>;
template class NumberType<double>;
template class NumberType<char>;
template class NumberType<unsigned char>;
template class NumberType<short>;
template class NumberType<unsigned short>;
template class NumberType<int>;
template class NumberType<unsigned int>;
template class NumberType<long>;
template class NumberType<unsigned long>;
template class NumberType<long long>;
template class NumberType<unsigned long long>;

}  // namespace types
}  // namespace touca
