/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "touca/devkit/object.hpp"
#include "rapidjson/document.h"
#include "rapidjson/rapidjson.h"
#include "touca/devkit/comparison.hpp"
#include "touca/impl/touca_generated.h"

namespace touca { namespace types {

    /**
     *
     */
    Object::Object(const std::string& name)
        : _name(name)
    {
    }

    /**
     *
     */
    ValueType Object::type() const
    {
        return ValueType::Object;
    }

    /**
     *
     */
    rapidjson::Value Object::json(
        rapidjson::Document::AllocatorType& allocator) const
    {
        rapidjson::Value rjMembers(rapidjson::kObjectType);
        for (const auto& member : _values) {
            rapidjson::Value rjKey { member.first, allocator };
            rjMembers.AddMember(
                rjKey, member.second->json(allocator), allocator);
        }

        rapidjson::Value rjValue(rapidjson::kObjectType);
        rapidjson::Value rjName { _name, allocator };
        rjValue.AddMember(rjName, rjMembers, allocator);
        return rjValue;
    }

    /**
     *
     */
    flatbuffers::Offset<fbs::TypeWrapper> Object::serialize(
        flatbuffers::FlatBufferBuilder& builder) const
    {
        std::vector<flatbuffers::Offset<fbs::ObjectMember>>
            fbsObjectMembers_vector;
        for (const auto& value : _values) {
            const auto& fbsMemberKey = builder.CreateString(value.first);
            const auto& fbsMemberValue = value.second->serialize(builder);
            fbs::ObjectMemberBuilder fbsObjectMember_builder(builder);
            fbsObjectMember_builder.add_name(fbsMemberKey);
            fbsObjectMember_builder.add_value(fbsMemberValue);
            const auto& fbsObjectMember = fbsObjectMember_builder.Finish();
            fbsObjectMembers_vector.push_back(fbsObjectMember);
        }
        const auto& fbsObjectMemebers = builder.CreateVector(fbsObjectMembers_vector);
        const auto& fbsKey = builder.CreateString(_name);
        fbs::ObjectBuilder fbsObject_builder(builder);
        fbsObject_builder.add_values(fbsObjectMemebers);
        fbsObject_builder.add_key(fbsKey);
        const auto& fbsValue = fbsObject_builder.Finish();
        fbs::TypeWrapperBuilder typeWrapper_builder(builder);
        typeWrapper_builder.add_value(fbsValue.Union());
        typeWrapper_builder.add_value_type(fbs::Type::Object);
        return typeWrapper_builder.Finish();
    }

    /**
     *
     */
    void Object::deserialize(const fbs::Object* fbsObj)
    {
        _name = fbsObj->key()->data();
        for (const auto&& value : *fbsObj->values()) {
            const auto& name = value->name()->data();
            const auto& obj = types::deserializeValue(value->value());
            if (!obj) {
                throw std::runtime_error("Could not deserialize the object");
            }
            _values.emplace(name, obj);
        }
    }

    /**
     *
     */
    compare::TypeComparison Object::compare(
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

        const auto dst = std::dynamic_pointer_cast<Object>(itype);
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
                if (compare::MatchType::Perfect == tmp.match) {
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
            result.match = compare::MatchType::Perfect;
            result.score = 1.0;
            return result;
        }

        result.dstValue = itype->string();

        // set score as match rate of children
        result.score = scoreEarned / scoreTotal;
        return result;
    }

    /**
     *
     */
    KeyMap Object::flatten() const
    {
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

}} // namespace touca::types
