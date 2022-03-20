// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/core/types.hpp"

#include <utility>

#include "flatbuffers/flatbuffers.h"
#include "nlohmann/json.hpp"
#include "touca/impl/schema.hpp"

namespace touca {
namespace detail {

flatbuffers::Offset<fbs::TypeWrapper> serialize(
    flatbuffers::FlatBufferBuilder& builder, const detail::boolean_t value) {
  fbs::BoolBuilder bool_builder(builder);
  bool_builder.add_value(value);
  const auto& fbsValue = bool_builder.Finish();
  fbs::TypeWrapperBuilder typeWrapper_builder(builder);
  typeWrapper_builder.add_value(fbsValue.Union());
  typeWrapper_builder.add_value_type(fbs::Type::Bool);
  return typeWrapper_builder.Finish();
}

flatbuffers::Offset<fbs::TypeWrapper> serialize(
    flatbuffers::FlatBufferBuilder& builder,
    const detail::number_double_t& value) {
  touca::fbs::DoubleBuilder fbsNumber_builder(builder);
  fbsNumber_builder.add_value(value);
  const auto& fbsNumber = fbsNumber_builder.Finish();

  std::pair<flatbuffers::Offset<void>, touca::fbs::Type> buffer;
  buffer.first = fbsNumber.Union();
  buffer.second = touca::fbs::Type::Double;
  fbs::TypeWrapperBuilder fbsTypeWrapper_builder(builder);
  fbsTypeWrapper_builder.add_value(buffer.first);
  fbsTypeWrapper_builder.add_value_type(buffer.second);
  return fbsTypeWrapper_builder.Finish();
}

flatbuffers::Offset<fbs::TypeWrapper> serialize(
    flatbuffers::FlatBufferBuilder& builder,
    const detail::number_float_t& value) {
  touca::fbs::FloatBuilder fbsNumber_builder(builder);
  fbsNumber_builder.add_value(value);
  const auto& fbsNumber = fbsNumber_builder.Finish();

  std::pair<flatbuffers::Offset<void>, touca::fbs::Type> buffer;
  buffer.first = fbsNumber.Union();
  buffer.second = touca::fbs::Type::Float;
  fbs::TypeWrapperBuilder fbsTypeWrapper_builder(builder);
  fbsTypeWrapper_builder.add_value(buffer.first);
  fbsTypeWrapper_builder.add_value_type(buffer.second);
  return fbsTypeWrapper_builder.Finish();
}

flatbuffers::Offset<fbs::TypeWrapper> serialize(
    flatbuffers::FlatBufferBuilder& builder,
    const detail::number_signed_t& value) {
  touca::fbs::IntBuilder fbsNumber_builder(builder);
  fbsNumber_builder.add_value(value);
  const auto& fbsNumber = fbsNumber_builder.Finish();

  std::pair<flatbuffers::Offset<void>, touca::fbs::Type> buffer;
  buffer.first = fbsNumber.Union();
  buffer.second = touca::fbs::Type::Int;
  fbs::TypeWrapperBuilder fbsTypeWrapper_builder(builder);
  fbsTypeWrapper_builder.add_value(buffer.first);
  fbsTypeWrapper_builder.add_value_type(buffer.second);
  return fbsTypeWrapper_builder.Finish();
}

flatbuffers::Offset<fbs::TypeWrapper> serialize(
    flatbuffers::FlatBufferBuilder& builder,
    const detail::number_unsigned_t& value) {
  touca::fbs::UIntBuilder fbsNumber_builder(builder);
  fbsNumber_builder.add_value(value);
  const auto& fbsNumber = fbsNumber_builder.Finish();

  std::pair<flatbuffers::Offset<void>, touca::fbs::Type> buffer;
  buffer.first = fbsNumber.Union();
  buffer.second = touca::fbs::Type::UInt;
  fbs::TypeWrapperBuilder fbsTypeWrapper_builder(builder);
  fbsTypeWrapper_builder.add_value(buffer.first);
  fbsTypeWrapper_builder.add_value_type(buffer.second);
  return fbsTypeWrapper_builder.Finish();
}

flatbuffers::Offset<fbs::TypeWrapper> serialize(
    flatbuffers::FlatBufferBuilder& builder, const detail::string_t& value) {
  const auto& fbsStringValue = builder.CreateString(value);
  fbs::StringBuilder string_builder(builder);
  string_builder.add_value(fbsStringValue);
  const auto& fbsValue = string_builder.Finish();
  fbs::TypeWrapperBuilder typeWrapper_builder(builder);
  typeWrapper_builder.add_value(fbsValue.Union());
  typeWrapper_builder.add_value_type(fbs::Type::String);
  return typeWrapper_builder.Finish();
}

flatbuffers::Offset<fbs::TypeWrapper> serialize(
    flatbuffers::FlatBufferBuilder& builder, const detail::array_t& elements) {
  std::vector<flatbuffers::Offset<fbs::TypeWrapper>> fbsEntries_vector;
  for (const auto& element : elements) {
    fbsEntries_vector.push_back(element.serialize(builder));
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

flatbuffers::Offset<fbs::TypeWrapper> serialize(
    flatbuffers::FlatBufferBuilder& builder, const detail::object_t& obj,
    const std::string& name) {
  std::vector<flatbuffers::Offset<fbs::ObjectMember>> fbsObjectMembers_vector;
  for (const auto& value : obj) {
    const auto& fbsMemberKey = builder.CreateString(value.first);
    const auto& fbsMemberValue = value.second.serialize(builder);
    fbs::ObjectMemberBuilder fbsObjectMember_builder(builder);
    fbsObjectMember_builder.add_name(fbsMemberKey);
    fbsObjectMember_builder.add_value(fbsMemberValue);
    const auto& fbsObjectMember = fbsObjectMember_builder.Finish();
    fbsObjectMembers_vector.push_back(fbsObjectMember);
  }
  const auto& fbsObjectMembers = builder.CreateVector(fbsObjectMembers_vector);
  const auto& fbsKey = builder.CreateString(name);
  fbs::ObjectBuilder fbsObject_builder(builder);
  fbsObject_builder.add_values(fbsObjectMembers);
  fbsObject_builder.add_key(fbsKey);
  const auto& fbsValue = fbsObject_builder.Finish();
  fbs::TypeWrapperBuilder typeWrapper_builder(builder);
  typeWrapper_builder.add_value(fbsValue.Union());
  typeWrapper_builder.add_value_type(fbs::Type::Object);
  return typeWrapper_builder.Finish();
}

}  // namespace detail

void data_point::init_from_other(const data_point& src, bool) {
  _name = src._name;
  _type = src._type;

  switch (_type) {
    case detail::internal_type::null:
    case detail::internal_type::unknown:
      break;

    case detail::internal_type::boolean:
      _boolean = src._boolean;
      break;

    case detail::internal_type::number_double:
      _number_double = src._number_double;
      break;

    case detail::internal_type::number_float:
      _number_float = src._number_float;
      break;

    case detail::internal_type::number_signed:
      _number_signed = src._number_signed;
      break;

    case detail::internal_type::number_unsigned:
      _number_unsigned = src._number_unsigned;
      break;

    case detail::internal_type::string:
      _string = detail::create<detail::string_t>(*src._string);
      break;

    case detail::internal_type::array:
      _array = detail::create<detail::array_t>(*src._array);
      break;

    case detail::internal_type::object:
      _object = detail::create<detail::object_t>(*src._object);
      break;
  }
}

void data_point::init_from_other(data_point&& src, bool assign) noexcept {
  _name = std::move(src._name);
  _type = src._type;

  switch (_type) {
    case detail::internal_type::null:
    case detail::internal_type::unknown:
      break;

    case detail::internal_type::boolean:
      _boolean = src._boolean;
      break;

    case detail::internal_type::number_double:
      _number_double = src._number_double;
      break;

    case detail::internal_type::number_float:
      _number_float = src._number_float;
      break;

    case detail::internal_type::number_signed:
      _number_signed = src._number_signed;
      break;

    case detail::internal_type::number_unsigned:
      _number_unsigned = src._number_unsigned;
      break;

    case detail::internal_type::string:
      _string = detail::exchange(src._string, (assign ? _string : nullptr));
      break;

    case detail::internal_type::array:
      _array = detail::exchange(src._array, (assign ? _array : nullptr));
      break;

    case detail::internal_type::object:
      _object = detail::exchange(src._object, (assign ? _object : nullptr));
      break;
  }
}

void data_point::destroy() {
  switch (_type) {
    case detail::internal_type::string:
      detail::destroy<detail::string_t>(_string);
      break;

    case detail::internal_type::array:
      detail::destroy<detail::array_t>(_array);
      break;

    case detail::internal_type::object:
      detail::destroy<detail::object_t>(_object);
      break;

    default:
      return;  // primary types
  }
}

void data_point::increment() noexcept { ++_number_unsigned; }

flatbuffers::Offset<fbs::TypeWrapper> data_point::serialize(
    flatbuffers::FlatBufferBuilder& builder) const {
  switch (_type) {
    case detail::internal_type::boolean:
      return detail::serialize(builder, _boolean);
    case detail::internal_type::number_double:
      return detail::serialize(builder, _number_double);
    case detail::internal_type::number_float:
      return detail::serialize(builder, _number_float);
    case detail::internal_type::number_signed:
      return detail::serialize(builder, _number_signed);
    case detail::internal_type::number_unsigned:
      return detail::serialize(builder, _number_unsigned);
    case detail::internal_type::string:
      return detail::serialize(builder, *_string);
    case detail::internal_type::array:
      return detail::serialize(builder, *_array);
    case detail::internal_type::object:
      return detail::serialize(builder, *_object, _name);
    default:
      return detail::serialize(builder, false);
  }
}

std::string data_point::to_string() const {
  if (_type == detail::internal_type::string) return *_string;

  return nlohmann::json(*this).dump();
}

void to_json(nlohmann::json& out, const data_point& value) {
  switch (value._type) {
    case detail::internal_type::boolean:
      out = nlohmann::json(value._boolean);
      break;
    case detail::internal_type::number_double:
      out = nlohmann::json(value._number_double);
      break;
    case detail::internal_type::number_float:
      out = nlohmann::json(value._number_float);
      break;
    case detail::internal_type::number_signed:
      out = nlohmann::json(value._number_signed);
      break;
    case detail::internal_type::number_unsigned:
      out = nlohmann::json(value._number_unsigned);
      break;
    case detail::internal_type::string:
      out = nlohmann::json(*value._string);
      break;
    case detail::internal_type::array: {
      out = nlohmann::json::array();
      for (const auto& element : *value._array) {
        out.push_back(nlohmann::json(element));
      }
      break;
    }
    case detail::internal_type::object: {
      auto items = nlohmann::ordered_json::object();
      for (const auto& member : *value._object) {
        items.emplace(member.first, nlohmann::json(member.second));
      }
      out = nlohmann::ordered_json::object();
      out[value._name] = items;
      break;
    }
    default:
      break;
  }
}

}  // namespace touca
