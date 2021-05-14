/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "touca/devkit/types.hpp"
#include "fmt/format.h"
#include "rapidjson/document.h"
#include "rapidjson/rapidjson.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"
#include "touca/devkit/comparison.hpp"
#include "touca/devkit/convert.hpp"
#include "touca/devkit/object.hpp"
#include "touca/impl/touca_generated.h"
#include <cmath>

namespace { namespace filescope {

    /**
     *
     */
    template <typename T>
    typename std::enable_if<
        touca::convert::conform::is_touca_number<T>::value
            && std::is_same<float, typename std::remove_cv<T>::type>::value,
        std::pair<flatbuffers::Offset<void>, touca::fbs::Type>>::type
    serialize_number(const T& value, flatbuffers::FlatBufferBuilder& builder)
    {
        touca::fbs::FloatBuilder fbsNumber_builder(builder);
        fbsNumber_builder.add_value(value);
        const auto& fbsNumber = fbsNumber_builder.Finish();

        std::pair<flatbuffers::Offset<void>, touca::fbs::Type> buffer;
        buffer.first = fbsNumber.Union();
        buffer.second = touca::fbs::Type::Float;
        return buffer;
    }

    /**
     *
     */
    template <typename T>
    typename std::enable_if<
        touca::convert::conform::is_touca_number<T>::value
            && std::is_same<double, typename std::remove_cv<T>::type>::value,
        std::pair<flatbuffers::Offset<void>, touca::fbs::Type>>::type
    serialize_number(const T& value, flatbuffers::FlatBufferBuilder& builder)
    {
        touca::fbs::DoubleBuilder fbsNumber_builder(builder);
        fbsNumber_builder.add_value(value);
        const auto& fbsNumber = fbsNumber_builder.Finish();

        std::pair<flatbuffers::Offset<void>, touca::fbs::Type> buffer;
        buffer.first = fbsNumber.Union();
        buffer.second = touca::fbs::Type::Double;
        return buffer;
    }

    /**
     *
     */
    template <typename T>
    typename std::enable_if<
        touca::convert::conform::is_touca_number<T>::value
            && !std::is_floating_point<T>::value && std::is_signed<T>::value,
        std::pair<flatbuffers::Offset<void>, touca::fbs::Type>>::type
    serialize_number(const T& value, flatbuffers::FlatBufferBuilder& builder)
    {
        touca::fbs::IntBuilder fbsNumber_builder(builder);
        fbsNumber_builder.add_value(value);
        const auto& fbsNumber = fbsNumber_builder.Finish();

        std::pair<flatbuffers::Offset<void>, touca::fbs::Type> buffer;
        buffer.first = fbsNumber.Union();
        buffer.second = touca::fbs::Type::Int;
        return buffer;
    }

    /**
     *
     */
    template <typename T>
    typename std::enable_if<
        touca::convert::conform::is_touca_number<T>::value
            && !std::is_floating_point<T>::value && !std::is_signed<T>::value,
        std::pair<flatbuffers::Offset<void>, touca::fbs::Type>>::type
    serialize_number(const T& value, flatbuffers::FlatBufferBuilder& builder)
    {
        touca::fbs::UIntBuilder fbsNumber_builder(builder);
        fbsNumber_builder.add_value(value);
        const auto& fbsNumber = fbsNumber_builder.Finish();

        std::pair<flatbuffers::Offset<void>, touca::fbs::Type> buffer;
        buffer.first = fbsNumber.Union();
        buffer.second = touca::fbs::Type::UInt;
        return buffer;
    }

    /**
     *
     */
    template <typename T>
    typename std::enable_if<
        touca::convert::conform::is_touca_number<T>::value
            && std::is_same<float, typename std::remove_cv<T>::type>::value,
        rapidjson::Value>::type
    jsonify_number(const T& value)
    {
        rapidjson::Value ret(rapidjson::kNumberType);
        ret.SetFloat(value);
        return ret;
    }

    /**
     *
     */
    template <typename T>
    typename std::enable_if<
        touca::convert::conform::is_touca_number<T>::value
            && std::is_same<double, typename std::remove_cv<T>::type>::value,
        rapidjson::Value>::type
    jsonify_number(const T& value)
    {
        rapidjson::Value ret(rapidjson::kNumberType);
        ret.SetDouble(value);
        return ret;
    }

    /**
     *
     */
    template <typename T>
    typename std::enable_if<
        touca::convert::conform::is_touca_number<T>::value
            && !std::is_floating_point<T>::value && std::is_signed<T>::value,
        rapidjson::Value>::type
    jsonify_number(const T& value)
    {
        rapidjson::Value ret(rapidjson::kNumberType);
        ret.SetInt64(value);
        return ret;
    }

    /**
     *
     */
    template <typename T>
    typename std::enable_if<
        touca::convert::conform::is_touca_number<T>::value
            && !std::is_floating_point<T>::value && !std::is_signed<T>::value,
        rapidjson::Value>::type
    jsonify_number(const T& value)
    {
        rapidjson::Value ret(rapidjson::kNumberType);
        ret.SetUint64(value);
        return ret;
    }

    /**
     *
     */
    template <typename T, typename U>
    std::shared_ptr<touca::types::IType> deserialize(
        const touca::fbs::TypeWrapper* ptr)
    {
        const auto& castptr = static_cast<const T*>(ptr->value());
        return std::shared_ptr<touca::types::IType>(new U(castptr->value()));
    }

}} // namespace ::filescope

namespace touca { namespace types {

    /**
     *
     */
    std::string IType::string() const
    {
        rapidjson::Document doc;
        auto& allocator = doc.GetAllocator();
        const auto& value = json(allocator);
        if (value.IsString()) {
            return value.GetString();
        }
        rapidjson::StringBuffer strbuf;
        rapidjson::Writer<rapidjson::StringBuffer> writer(strbuf);
        writer.SetMaxDecimalPlaces(3);
        value.Accept(writer);
        return strbuf.GetString();
    }

    /**
     *
     */
    std::shared_ptr<IType> deserializeValue(const fbs::TypeWrapper* ptr)
    {
        const auto& value = ptr->value();
        const auto& type = ptr->value_type();
        switch (type) {
        case fbs::Type::Bool:
            return filescope::deserialize<fbs::Bool, Bool>(ptr);
        case fbs::Type::Int:
            return filescope::deserialize<fbs::Int, Number<int64_t>>(ptr);
        case fbs::Type::UInt:
            return filescope::deserialize<fbs::UInt, Number<uint64_t>>(ptr);
        case fbs::Type::Float:
            return filescope::deserialize<fbs::Float, Number<float>>(ptr);
        case fbs::Type::Double:
            return filescope::deserialize<fbs::Double, Number<double>>(ptr);
        case fbs::Type::String: {
            const auto& str = static_cast<const fbs::String*>(value);
            return std::make_shared<String>(str->value()->data());
        }
        case fbs::Type::Object: {
            auto obj = std::make_shared<Object>();
            obj->deserialize(static_cast<const fbs::Object*>(value));
            return obj;
        }
        case fbs::Type::Array: {
            auto arr = std::make_shared<Array>();
            arr->deserialize(static_cast<const fbs::Array*>(value));
            return arr;
        }
        default:
            throw std::runtime_error("encountered unexpected type");
        }
    }

    /**
     *
     */
    Bool::Bool(bool value)
        : _value(value)
    {
    }

    /**
     *
     */
    ValueType Bool::type() const
    {
        return ValueType::Bool;
    }

    /**
     *
     */
    rapidjson::Value Bool::json(
        rapidjson::Document::AllocatorType& allocator) const
    {
        std::ignore = allocator;
        return rapidjson::Value { _value };
    }

    /**
     *
     */
    flatbuffers::Offset<fbs::TypeWrapper> Bool::serialize(
        flatbuffers::FlatBufferBuilder& builder) const
    {
        fbs::BoolBuilder bool_builder(builder);
        bool_builder.add_value(_value);
        const auto& fbsValue = bool_builder.Finish();
        fbs::TypeWrapperBuilder typeWrapper_builder(builder);
        typeWrapper_builder.add_value(fbsValue.Union());
        typeWrapper_builder.add_value_type(fbs::Type::Bool);
        return typeWrapper_builder.Finish();
    }

    /**
     *
     */
    compare::TypeComparison Bool::compare(
        const std::shared_ptr<IType>& itype) const
    {
        compare::TypeComparison result;
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

        // two Bool objects are equal if they have identical values.

        const auto dst = std::dynamic_pointer_cast<Bool>(itype);
        if (_value == dst->_value) {
            result.match = compare::MatchType::Perfect;
            result.score = 1.0;
            return result;
        }

        result.dstValue = itype->string();

        return result;
    }

    /**
     *
     */
    template <class T>
    Number<T>::Number(T value)
        : _value(value)
    {
    }

    /**
     *
     */
    template <class T>
    ValueType Number<T>::type() const
    {
        return ValueType::Number;
    }

    /**
     *
     */
    template <class T>
    rapidjson::Value Number<T>::json(
        rapidjson::Document::AllocatorType& allocator) const
    {
        std::ignore = allocator;
        return filescope::jsonify_number<T>(_value);
    }

    /**
     *
     */
    template <class T>
    T Number<T>::value() const
    {
        return _value;
    }

    /**
     *
     */
    template <class T>
    flatbuffers::Offset<fbs::TypeWrapper> Number<T>::serialize(
        flatbuffers::FlatBufferBuilder& fbb) const
    {
        const auto& buffer = filescope::serialize_number<T>(_value, fbb);
        fbs::TypeWrapperBuilder fbsTypeWrapper_builder(fbb);
        fbsTypeWrapper_builder.add_value(buffer.first);
        fbsTypeWrapper_builder.add_value_type(buffer.second);
        return fbsTypeWrapper_builder.Finish();
    }

    /**
     *
     */
    template <class T>
    compare::TypeComparison Number<T>::compare(
        const std::shared_ptr<IType>& itype) const
    {
        compare::TypeComparison result;
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

        // two Number objects are equal if their numeric value is equal
        // in their original type.

        const auto dst = std::dynamic_pointer_cast<Number<T>>(itype);
        if (_value == dst->_value) {
            result.match = compare::MatchType::Perfect;
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

    /**
     *
     */
    String::String(const std::string& value)
        : _value(value)
    {
    }

    /**
     *
     */
    ValueType String::type() const
    {
        return ValueType::String;
    }

    /**
     *
     */
    rapidjson::Value String::json(
        rapidjson::Document::AllocatorType& allocator) const
    {
        return rapidjson::Value { _value, allocator };
    }

    /**
     *
     */
    flatbuffers::Offset<fbs::TypeWrapper> String::serialize(
        flatbuffers::FlatBufferBuilder& builder) const
    {
        const auto& fbsStringValue = builder.CreateString(_value);
        fbs::StringBuilder string_builder(builder);
        string_builder.add_value(fbsStringValue);
        const auto& fbsValue = string_builder.Finish();
        fbs::TypeWrapperBuilder typeWrapper_builder(builder);
        typeWrapper_builder.add_value(fbsValue.Union());
        typeWrapper_builder.add_value_type(fbs::Type::String);
        return typeWrapper_builder.Finish();
    }

    /**
     *
     */
    compare::TypeComparison String::compare(
        const std::shared_ptr<IType>& itype) const
    {
        compare::TypeComparison result;
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

        // two String objects are equal if they have identical values

        const auto dst = std::dynamic_pointer_cast<String>(itype);
        if (0 == _value.compare(dst->_value)) {
            result.match = compare::MatchType::Perfect;
            result.score = 1.0;
            return result;
        }

        result.dstValue = itype->string();

        return result;
    }

    /**
     *
     */
    ValueType Array::type() const
    {
        return ValueType::Array;
    }

    /**
     *
     */
    rapidjson::Value Array::json(
        rapidjson::Document::AllocatorType& allocator) const
    {
        rapidjson::Value rjValue(rapidjson::kArrayType);
        for (const auto& v : _values) {
            rjValue.PushBack(v->json(allocator), allocator);
        }
        return rjValue;
    }

    /**
     *
     */
    flatbuffers::Offset<fbs::TypeWrapper> Array::serialize(
        flatbuffers::FlatBufferBuilder& builder) const
    {
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

    /**
     *
     */
    void Array::add(const std::shared_ptr<types::IType>& value)
    {
        _values.push_back(value);
    }

    /**
     *
     */
    void Array::deserialize(const fbs::Array* obj)
    {
        for (const auto&& value : *obj->values()) {
            _values.push_back(deserializeValue(value));
        }
    }

    /**
     *
     */
    compare::TypeComparison Array::compare(
        const std::shared_ptr<IType>& itype) const
    {
        compare::TypeComparison result;
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

        // helper function to get flattened list of elements of an Array
        // object.
        const auto get_flattened = [](const Array& arr) {
            const auto kvps = arr.flatten();
            std::vector<std::shared_ptr<IType>> items;
            items.reserve(kvps.size());
            for (const auto& kvp : kvps) {
                items.emplace_back(kvp.second);
            }
            return items;
        };

        const auto dst = std::dynamic_pointer_cast<Array>(itype);
        const auto srcMembers = get_flattened(*this);
        const auto dstMembers = get_flattened(*dst);

        const std::pair<size_t, size_t> minmax = std::minmax(srcMembers.size(), dstMembers.size());

        // if the two result keys are both empty arrays, we consider them
        // identical. we choose to handle this special case to prevent
        // divide by zero.

        if (0u == minmax.second) {
            result.match = compare::MatchType::Perfect;
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
            const auto& change = srcMembers.size() < dstMembers.size() ? "shrunk" : "grown";
            result.desc.insert(fmt::format("array size {} by {} elements", change, diffRange));
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
            if (compare::MatchType::None == tmp.match) {
                differences.emplace(i, tmp.desc);
            }
        }

        // we will only report element-wise differences if the number of
        // different elements does not exceed our threshold that determines
        // if this information is helpful to user.
        const auto diffRatioThreshold = 0.2;
        const auto diffSizeThreshold = 10u;
        const auto diffRatio = differences.size() / static_cast<double>(srcMembers.size());
        if (diffRatio < diffRatioThreshold || differences.size() < diffSizeThreshold) {
            for (const auto& diff : differences) {
                for (const auto& msg : diff.second) {
                    result.desc.insert(fmt::format("[{}]:{}", diff.first, msg));
                }
            }
            result.score = scoreEarned / minmax.second;
        }

        if (1.0 == result.score) {
            result.match = compare::MatchType::Perfect;
            return result;
        }

        result.dstValue = itype->string();
        return result;
    }

    /**
     *
     */
    KeyMap Array::flatten() const
    {
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

    /**
     *
     */

    template class Number<float>;
    template class Number<double>;
    template class Number<char>;
    template class Number<unsigned char>;
    template class Number<short>;
    template class Number<unsigned short>;
    template class Number<int>;
    template class Number<unsigned int>;
    template class Number<long>;
    template class Number<unsigned long>;
    template class Number<long long>;
    template class Number<unsigned long long>;

}} // namespace touca::types
