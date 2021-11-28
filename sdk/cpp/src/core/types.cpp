// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/core/types.hpp"

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

internal_value::internal_value() {}
internal_value::internal_value(const boolean_t v) noexcept : boolean(v) {}
internal_value::internal_value(const number_double_t v) noexcept
    : number_double(v) {}
internal_value::internal_value(const number_float_t v) noexcept
    : number_float(v) {}
internal_value::internal_value(const number_signed_t v) noexcept
    : number_signed(v) {}
internal_value::internal_value(const number_unsigned_t v) noexcept
    : number_unsigned(v) {}
internal_value::internal_value(const string_t& v) noexcept
    : string(create<string_t>(v)) {}
internal_value internal_value::as_array() {
  internal_value v;
  v = create<array_t>();
  return v;
}
internal_value internal_value::as_object() {
  internal_value v;
  v = create<object_t>();
  return v;
}

}  // namespace detail

data_point::data_point(const array& value)
    : _type(detail::internal_type::array),
      _value(detail::internal_value::as_array()) {
  _value.array = value._v;
}

data_point::data_point(const object& value)
    : _type(detail::internal_type::object),
      _value(detail::internal_value::as_object()) {
  _name = value.name;
  _value.object = value._v;
}

data_point data_point::null() {
  return data_point(detail::internal_type::null);
}

data_point data_point::boolean(const detail::boolean_t value) {
  return data_point(detail::internal_type::boolean, value);
}

data_point data_point::number_signed(const detail::number_signed_t value) {
  return data_point(detail::internal_type::number_signed, value);
}

data_point data_point::number_unsigned(const detail::number_unsigned_t value) {
  return data_point(detail::internal_type::number_unsigned, value);
}

data_point data_point::number_double(const detail::number_double_t value) {
  return data_point(detail::internal_type::number_double, value);
}

data_point data_point::number_float(const detail::number_float_t value) {
  return data_point(detail::internal_type::number_float, value);
}

data_point data_point::string(const detail::string_t& value) {
  return data_point(detail::internal_type::string, value);
}

void data_point::increment() { _value.number_unsigned += 1; }

detail::array_t* data_point::as_array() const { return _value.array; }

detail::number_unsigned_t data_point::as_metric() const {
  return _value.number_unsigned;
}

detail::internal_type data_point::type() const { return _type; }

flatbuffers::Offset<fbs::TypeWrapper> data_point::serialize(
    flatbuffers::FlatBufferBuilder& builder) const {
  switch (_type) {
    case detail::internal_type::boolean:
      return detail::serialize(builder, _value.boolean);
    case detail::internal_type::number_double:
      return detail::serialize(builder, _value.number_double);
    case detail::internal_type::number_float:
      return detail::serialize(builder, _value.number_float);
    case detail::internal_type::number_signed:
      return detail::serialize(builder, _value.number_signed);
    case detail::internal_type::number_unsigned:
      return detail::serialize(builder, _value.number_unsigned);
    case detail::internal_type::string:
      return detail::serialize(builder, *_value.string);
    case detail::internal_type::array:
      return detail::serialize(builder, *_value.array);
    case detail::internal_type::object:
      return detail::serialize(builder, *_value.object, _name);
    default:
      return detail::serialize(builder, false);
  }
}

data_point::data_point(detail::internal_type type) : _type(type) {}

data_point::data_point(detail::internal_type type,
                       const detail::internal_value& value)
    : _type(type), _value(value) {}

std::string data_point::to_string() const {
  if (_type == detail::internal_type::string) {
    return *_value.string;
  }
  return nlohmann::json(*this).dump();
}

void to_json(nlohmann::json& out, const data_point& value) {
  switch (value._type) {
    case detail::internal_type::boolean:
      out = nlohmann::json(value._value.boolean);
      break;
    case detail::internal_type::number_double:
      out = nlohmann::json(value._value.number_double);
      break;
    case detail::internal_type::number_float:
      out = nlohmann::json(value._value.number_float);
      break;
    case detail::internal_type::number_signed:
      out = nlohmann::json(value._value.number_signed);
      break;
    case detail::internal_type::number_unsigned:
      out = nlohmann::json(value._value.number_unsigned);
      break;
    case detail::internal_type::string:
      out = nlohmann::json(*value._value.string);
      break;
    case detail::internal_type::array: {
      out = nlohmann::json::array();
      for (const auto& element : *value._value.array) {
        out.push_back(nlohmann::json(element));
      }
      break;
    }
    case detail::internal_type::object: {
      auto items = nlohmann::ordered_json::object();
      for (const auto& member : *value._value.object) {
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
