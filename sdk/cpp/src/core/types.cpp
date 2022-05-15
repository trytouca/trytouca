// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/core/types.hpp"

#include <cstddef>
#include <type_traits>
#include <utility>

#include "flatbuffers/flatbuffers.h"
#include "rapidjson/document.h"
#include "rapidjson/rapidjson.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"
#include "touca/core/variant.hpp"
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
    flatbuffers::FlatBufferBuilder& builder, const array& elements) {
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
    flatbuffers::FlatBufferBuilder& builder, const object& obj) {
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
  const auto& fbsKey = builder.CreateString(obj.get_name());
  fbs::ObjectBuilder fbsObject_builder(builder);
  fbsObject_builder.add_values(fbsObjectMembers);
  fbsObject_builder.add_key(fbsKey);
  const auto& fbsValue = fbsObject_builder.Finish();
  fbs::TypeWrapperBuilder typeWrapper_builder(builder);
  typeWrapper_builder.add_value(fbsValue.Union());
  typeWrapper_builder.add_value_type(fbs::Type::Object);
  return typeWrapper_builder.Finish();
}

class data_point_serializer_visitor {
  flatbuffers::FlatBufferBuilder& _builder;

 public:
  explicit data_point_serializer_visitor(
      flatbuffers::FlatBufferBuilder& builder)
      : _builder(builder) {}

  template <typename T>
  flatbuffers::Offset<fbs::TypeWrapper> operator()(const T& value) {
    return serialize(_builder, value);
  }

  template <typename T>
  flatbuffers::Offset<fbs::TypeWrapper> operator()(
      const detail::deep_copy_ptr<T>& ptr) {
    return serialize(_builder, *ptr);
  }

  flatbuffers::Offset<fbs::TypeWrapper> operator()(std::nullptr_t) {
    return serialize(_builder, false);
  }
};

class data_point_to_json_visitor {
  rapidjson::Document::AllocatorType& _allocator;

 public:
  explicit data_point_to_json_visitor(
      rapidjson::Document::AllocatorType& allocator)
      : _allocator(allocator) {}

  rapidjson::Value operator()(const detail::deep_copy_ptr<std::string>& value) {
    return rapidjson::Value(*value, _allocator);
  }

  rapidjson::Value operator()(const detail::deep_copy_ptr<array>& arr) {
    rapidjson::Value out(rapidjson::kArrayType);
    for (const auto& element : *arr) {
      out.PushBack(to_json(element, _allocator), _allocator);
    }
    return out;
  }

  rapidjson::Value operator()(const detail::deep_copy_ptr<object>& obj) {
    rapidjson::Value rjMembers(rapidjson::kObjectType);
    for (const auto& member : *obj) {
      rapidjson::Value rjKey{member.first, _allocator};
      rjMembers.AddMember(rjKey, to_json(member.second, _allocator),
                          _allocator);
    }
    rapidjson::Value out(rapidjson::kObjectType);
    rapidjson::Value rjName{obj->get_name(), _allocator};
    out.AddMember(rjName, rjMembers, _allocator);
    return out;
  }

  rapidjson::Value operator()(const detail::number_signed_t value) {
    rapidjson::Value out(rapidjson::kNumberType);
    out.SetInt64(value);
    return out;
  }

  rapidjson::Value operator()(const detail::number_unsigned_t value) {
    rapidjson::Value out(rapidjson::kNumberType);
    out.SetUint64(value);
    return out;
  }

  rapidjson::Value operator()(const detail::number_double_t value) {
    rapidjson::Value out(rapidjson::kNumberType);
    out.SetDouble(value);
    return out;
  }

  rapidjson::Value operator()(const detail::number_float_t value) {
    rapidjson::Value out(rapidjson::kNumberType);
    out.SetFloat(value);
    return out;
  }

  rapidjson::Value operator()(const detail::boolean_t value) {
    return rapidjson::Value(value);
  }

  rapidjson::Value operator()(std::nullptr_t) {
    return rapidjson::Value(rapidjson::kNullType);
  }
};

}  // namespace detail

void data_point::increment() noexcept {
  ++detail::get<detail::number_unsigned_t>(_value);
}

flatbuffers::Offset<fbs::TypeWrapper> data_point::serialize(
    flatbuffers::FlatBufferBuilder& builder) const {
  return detail::visit(detail::data_point_serializer_visitor(builder), _value);
}

std::string data_point::to_string() const {
  rapidjson::Document doc;
  auto& allocator = doc.GetAllocator();
  const auto& value = to_json(*this, allocator);
  if (value.IsString()) {
    return value.GetString();
  }
  rapidjson::StringBuffer strbuf;
  rapidjson::Writer<rapidjson::StringBuffer> writer(strbuf);
  writer.SetMaxDecimalPlaces(3);
  value.Accept(writer);
  return strbuf.GetString();
}

rapidjson::Value to_json(const data_point& value, RJAllocator& allocator) {
  return detail::visit(detail::data_point_to_json_visitor(allocator),
                       value._value);
}

}  // namespace touca
