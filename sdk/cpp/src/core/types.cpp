// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/core/types.hpp"

#include <cmath>

#include "flatbuffers/flatbuffers.h"
#include "fmt/format.h"
#include "nlohmann/json.hpp"
#include "touca/core/serializer.hpp"
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

internal_type IType::type() const { return _type_t; }

std::string IType::string() const {
  const auto& element = json();
  return element.type() == nlohmann::json::value_t::string
             ? element.get<std::string>()
             : element.dump();
}

NoneType::NoneType() : IType(internal_type::null) {}

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

BooleanType::BooleanType(bool value)
    : IType(internal_type::boolean), _value(value) {}

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
NumberType<T>::NumberType(T value)
    : IType(internal_type::number_signed), _value(value) {}

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
    : IType(internal_type::string), _value(value) {}

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

ArrayType::ArrayType() : IType(internal_type::array) {}

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

void ArrayType::add(const std::shared_ptr<IType>& value) {
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

ObjectType::ObjectType() : IType(internal_type::object) {}

ObjectType::ObjectType(const std::string& name)
    : IType(internal_type::object), _name(name) {}

ObjectType::ObjectType(const std::string& name, const KeyMap& values)
    : IType(internal_type::object), _name(name), _values(values) {}

nlohmann::ordered_json ObjectType::json() const {
  nlohmann::ordered_json members = nlohmann::json::object();
  for (const auto& member : _values) {
    members[member.first] = member.second->json();
  }

  if (_name.empty()) {
    return members;
  }

  return nlohmann::ordered_json({{_name, members}});
}

flatbuffers::Offset<fbs::TypeWrapper> ObjectType::serialize(
    flatbuffers::FlatBufferBuilder& builder) const {
  std::vector<flatbuffers::Offset<fbs::ObjectMember>> fbsObjectMembers_vector;
  for (const auto& value : _values) {
    const auto& fbsMemberKey = builder.CreateString(value.first);
    const auto& fbsMemberValue = value.second->serialize(builder);
    fbs::ObjectMemberBuilder fbsObjectMember_builder(builder);
    fbsObjectMember_builder.add_name(fbsMemberKey);
    fbsObjectMember_builder.add_value(fbsMemberValue);
    const auto& fbsObjectMember = fbsObjectMember_builder.Finish();
    fbsObjectMembers_vector.push_back(fbsObjectMember);
  }
  const auto& fbsObjectMembers = builder.CreateVector(fbsObjectMembers_vector);
  const auto& fbsKey = builder.CreateString(_name);
  fbs::ObjectBuilder fbsObject_builder(builder);
  fbsObject_builder.add_values(fbsObjectMembers);
  fbsObject_builder.add_key(fbsKey);
  const auto& fbsValue = fbsObject_builder.Finish();
  fbs::TypeWrapperBuilder typeWrapper_builder(builder);
  typeWrapper_builder.add_value(fbsValue.Union());
  typeWrapper_builder.add_value_type(fbs::Type::Object);
  return typeWrapper_builder.Finish();
}

TypeComparison ObjectType::compare(const std::shared_ptr<IType>& itype) const {
  TypeComparison result;
  result.srcType = type();
  result.srcValue = string();

  // the two result keys are considered completely different
  // if they are different in types.

  if (type() != itype->type()) {
    result.dstType = itype->type();
    result.dstValue = itype->string();
    result.desc.insert("result types are different");
    return result;
  }

  const auto dst = std::dynamic_pointer_cast<ObjectType>(itype);
  const auto& srcMembers = flatten();
  const auto& dstMembers = dst->flatten();

  auto scoreEarned = 0.0;
  auto scoreTotal = 0u;
  for (const auto& srcMember : srcMembers) {
    ++scoreTotal;
    // compare common members
    if (dstMembers.count(srcMember.first)) {
      const auto& dstKey = dstMembers.at(srcMember.first);
      const auto& tmp = srcMember.second->compare(dstKey);
      scoreEarned += tmp.score;
      if (MatchType::Perfect == tmp.match) {
        continue;
      }
      for (const auto& desc : tmp.desc) {
        const auto& msg = srcMember.first + ": " + desc;
        result.desc.insert(msg);
      }
      continue;
    }
    // report src members that are missing from dst
    const auto& msg = srcMember.first + ": missing";
    result.desc.insert(msg);
  }

  // report dst members that are missing from src
  for (const auto& dstMember : dstMembers) {
    if (!srcMembers.count(dstMember.first)) {
      const auto& msg = dstMember.first + ": new";
      result.desc.insert(msg);
      ++scoreTotal;
    }
  }

  // report comparison as perfect match if all children match
  if (scoreEarned == scoreTotal) {
    result.match = MatchType::Perfect;
    result.score = 1.0;
    return result;
  }

  result.dstValue = itype->string();

  // set score as match rate of children
  result.score = scoreEarned / scoreTotal;
  return result;
}

KeyMap ObjectType::flatten() const {
  KeyMap members;
  for (const auto& value : _values) {
    const auto& name = value.first;
    const auto& nestedMembers = value.second->flatten();
    if (nestedMembers.empty()) {
      members.emplace(name, value.second);
      continue;
    }
    for (const auto& nestedMember : nestedMembers) {
      const auto& key = name + '.' + nestedMember.first;
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

}  // namespace touca
