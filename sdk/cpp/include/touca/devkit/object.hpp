/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "touca/devkit/convert.hpp"
#include "touca/devkit/types.hpp"

namespace touca {
    namespace compare {
        struct TypeComparison;
    }
    namespace types {

        /**
         *
         */
        class TOUCA_CLIENT_API Object : public IType {
        public:
            /**
             *
             */
            Object() = default;

            /**
             *
             */
            explicit Object(const std::string& name);

            /**
             *
             */
            ValueType type() const override;

            /**
             *
             */
            rapidjson::Value json(RJAllocator& allocator) const override;

            /**
             *
             */
            template <typename T>
            void add(const std::string& key, T value)
            {
                _values.emplace(key, convert::Conversion<T>()(value));
            }

            /**
             *
             */
            flatbuffers::Offset<fbs::TypeWrapper> serialize(
                flatbuffers::FlatBufferBuilder& builder) const override;

            /**
             *
             */
            void deserialize(const fbs::Object* fbsObj);

            /**
             *
             */
            compare::TypeComparison compare(
                const std::shared_ptr<IType>& itype) const override;

            /**
             *
             */
            KeyMap flatten() const override;

        private:
            std::string _name;
            KeyMap _values;

        }; // class touca::types::Object

    } // namespace types

    namespace convert {

        /**
         *
         */
        template <typename T>
        struct Conversion<
            T,
            typename std::enable_if<
                conform::is_specialization<T, std::pair>::value>::type> {
            std::shared_ptr<types::IType> operator()(const T& value)
            {
                auto out = std::make_shared<types::Object>("std::pair");
                out->add("first", value.first);
                out->add("second", value.second);
                return out;
            }
        };

        /**
         *
         */
        template <typename T>
        struct Conversion<
            T,
            typename std::enable_if<
                conform::is_specialization<T, std::shared_ptr>::value>::type> {
            std::shared_ptr<types::IType> operator()(const T& value)
            {
                auto out = std::make_shared<types::Object>("std::shared_ptr");
                if (value) {
                    out->add("v", *value);
                }
                return out;
            }
        };

    } // namespace convert

} // namespace touca
