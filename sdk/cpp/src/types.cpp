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
    flatbuffers::FlatBufferBuilder& builder,
    const touca::detail::boolean_t value) {
  const auto& fbsNumber = fbs::CreateBool(builder, value);
  return fbs::CreateTypeWrapper(builder, fbs::Type::Bool, fbsNumber.Union());
}

flatbuffers::Offset<fbs::TypeWrapper> serialize(
    flatbuffers::FlatBufferBuilder& builder,
    const touca::detail::number_double_t& value) {
  const auto& fbsNumber = fbs::CreateDouble(builder, value);
  return fbs::CreateTypeWrapper(builder, fbs::Type::Double, fbsNumber.Union());
}

flatbuffers::Offset<fbs::TypeWrapper> serialize(
    flatbuffers::FlatBufferBuilder& builder,
    const touca::detail::number_float_t& value) {
  const auto& fbsNumber = fbs::CreateFloat(builder, value);
  return fbs::CreateTypeWrapper(builder, fbs::Type::Float, fbsNumber.Union());
}

flatbuffers::Offset<fbs::TypeWrapper> serialize(
    flatbuffers::FlatBufferBuilder& builder,
    const touca::detail::number_signed_t& value) {
  const auto& fbsNumber = fbs::CreateInt(builder, value);
  return fbs::CreateTypeWrapper(builder, fbs::Type::Int, fbsNumber.Union());
}

flatbuffers::Offset<fbs::TypeWrapper> serialize(
    flatbuffers::FlatBufferBuilder& builder,
    const touca::detail::number_unsigned_t& value) {
  const auto& fbsNumber = fbs::CreateUInt(builder, value);
  return fbs::CreateTypeWrapper(builder, fbs::Type::UInt, fbsNumber.Union());
}

flatbuffers::Offset<fbs::TypeWrapper> serialize(
    flatbuffers::FlatBufferBuilder& builder,
    const touca::detail::string_t& value) {
  const auto& fbsValue = fbs::CreateStringDirect(builder, value.c_str());
  return fbs::CreateTypeWrapper(builder, fbs::Type::String, fbsValue.Union());
}

flatbuffers::Offset<fbs::TypeWrapper> serialize(
    flatbuffers::FlatBufferBuilder& builder, const array& elements) {
  std::vector<flatbuffers::Offset<fbs::TypeWrapper>> entries;
  for (const auto& element : elements) {
    entries.push_back(element.serialize(builder));
  }
  const auto& fbsValue = fbs::CreateArrayDirect(builder, &entries);
  return fbs::CreateTypeWrapper(builder, fbs::Type::Array, fbsValue.Union());
}

flatbuffers::Offset<fbs::TypeWrapper> serialize(
    flatbuffers::FlatBufferBuilder& builder, const object& obj) {
  std::vector<flatbuffers::Offset<fbs::ObjectMember>> members;
  for (const auto& value : obj) {
    members.push_back(fbs::CreateObjectMemberDirect(
        builder, value.first.c_str(), value.second.serialize(builder)));
  }
  const auto& fbsValue =
      fbs::CreateObjectDirect(builder, obj.get_name().c_str(), &members);
  return fbs::CreateTypeWrapper(builder, fbs::Type::Object, fbsValue.Union());
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
      const touca::detail::deep_copy_ptr<T>& ptr) {
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

  rapidjson::Value operator()(
      const touca::detail::deep_copy_ptr<std::string>& value) {
    return rapidjson::Value(*value, _allocator);
  }

  rapidjson::Value operator()(const touca::detail::deep_copy_ptr<array>& arr) {
    rapidjson::Value out(rapidjson::kArrayType);
    for (const auto& element : *arr) {
      out.PushBack(to_json(element, _allocator), _allocator);
    }
    return out;
  }

  rapidjson::Value operator()(const touca::detail::deep_copy_ptr<object>& obj) {
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

  rapidjson::Value operator()(const touca::detail::number_signed_t value) {
    rapidjson::Value out(rapidjson::kNumberType);
    out.SetInt64(value);
    return out;
  }

  rapidjson::Value operator()(const touca::detail::number_unsigned_t value) {
    rapidjson::Value out(rapidjson::kNumberType);
    out.SetUint64(value);
    return out;
  }

  rapidjson::Value operator()(const touca::detail::number_double_t value) {
    rapidjson::Value out(rapidjson::kNumberType);
    out.SetDouble(value);
    return out;
  }

  rapidjson::Value operator()(const touca::detail::number_float_t value) {
    rapidjson::Value out(rapidjson::kNumberType);
    out.SetFloat(value);
    return out;
  }

  rapidjson::Value operator()(const touca::detail::boolean_t value) {
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
  return touca::detail::visit(touca::detail::data_point_serializer_visitor(builder),
                              _value);
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
  return touca::detail::visit(touca::detail::data_point_to_json_visitor(allocator),
                              value._value);
}

}  // namespace touca
