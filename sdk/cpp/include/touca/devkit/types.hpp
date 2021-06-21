// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "flatbuffers/flatbuffers.h"
#include "rapidjson/fwd.h"
#include "touca/lib_api.hpp"
#include <map>

namespace touca {
    namespace compare {
        struct TypeComparison;
    } // namespace compare
    namespace fbs {
        struct Array;
        struct Object;
        struct TypeWrapper;
    } // namespace fbs
    namespace types {
        class IType;
    } // namespace types

    enum class ResultsMapValueType {
        Check = 1,
        Assert
    };
    struct ResultsMapValue {
        std::shared_ptr<types::IType> val;
        ResultsMapValueType typ;
    };
    struct MetricsMapValue {
        std::shared_ptr<types::IType> value;
    };

    using RJAllocator = rapidjson::MemoryPoolAllocator<rapidjson::CrtAllocator>;
    using ResultsMap = std::map<std::string, ResultsMapValue>;
    using MetricsMap = std::map<std::string, MetricsMapValue>;
    using KeyMap = std::map<std::string, std::shared_ptr<types::IType>>;

    namespace types {

        /**
         *
         */
        enum class TOUCA_CLIENT_API ValueType : unsigned char {
            Bool,
            Number,
            String,
            Array,
            Object,
            Unknown
        };

        /**
         *
         */
        class TOUCA_CLIENT_API IType {
        public:
            /**
             *
             */
            IType(const IType&) = delete;

            /**
             *
             */
            IType& operator=(const IType&) = delete;

            /**
             *
             */
            virtual ~IType() = default;

            /**
             *
             */
            virtual ValueType type() const = 0;

            /**
             *
             */
            std::string string() const;

            /**
             *
             */
            virtual rapidjson::Value json(RJAllocator& allocator) const = 0;

            /**
             *
             */
            virtual flatbuffers::Offset<fbs::TypeWrapper> serialize(
                flatbuffers::FlatBufferBuilder& fbb) const = 0;

            /**
             *
             */
            virtual compare::TypeComparison compare(
                const std::shared_ptr<IType>& itype) const = 0;

            /**
             * This function flattens all of the object's nested ITypes into
             * one flat map. Only Object and Array types can have nested
             * values, so they are the only ones to override this default
             */
            virtual KeyMap flatten() const
            {
                return {};
            }

        protected:
            /**
             *
             */
            IType() = default;

        }; // class IType

        /**
         *
         */
        class TOUCA_CLIENT_API Bool : public IType {
        public:
            /**
             *
             */
            explicit Bool(bool value);

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
            flatbuffers::Offset<fbs::TypeWrapper> serialize(
                flatbuffers::FlatBufferBuilder& fbb) const override;

            /**
             *
             */
            compare::TypeComparison compare(
                const std::shared_ptr<IType>& itype) const override;

        private:
            bool _value;

        }; // class touca::types::Bool

        /**
         *
         */
        template <class T>
        class TOUCA_CLIENT_API Number : public IType {
        public:
            /**
             *
             */
            explicit Number(const T value);

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
            T value() const;

            /**
             *
             */
            flatbuffers::Offset<fbs::TypeWrapper> serialize(
                flatbuffers::FlatBufferBuilder& fbb) const override;

            /**
             *
             */
            compare::TypeComparison compare(
                const std::shared_ptr<IType>& itype) const override;

        private:
            T _value;

        }; // class touca::types::Number

        /**
         *
         */
        class TOUCA_CLIENT_API String : public IType {
        public:
            /**
             *
             */
            explicit String(const std::string& value);

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
            flatbuffers::Offset<fbs::TypeWrapper> serialize(
                flatbuffers::FlatBufferBuilder& fbb) const override;

            /**
             *
             */
            compare::TypeComparison compare(
                const std::shared_ptr<IType>& itype) const override;

        private:
            std::string _value;

        }; // class touca::types::String

        /**
         *
         */
        class TOUCA_CLIENT_API Array : public IType {
        public:
            /**
             *
             */
            void add(const std::shared_ptr<IType>& value);

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
            flatbuffers::Offset<fbs::TypeWrapper> serialize(
                flatbuffers::FlatBufferBuilder& fbb) const override;

            /**
             *
             */
            void deserialize(const fbs::Array* obj);

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
            std::vector<std::shared_ptr<IType>> _values;

        }; // class touca::types::Array

        /**
         *
         */
        std::shared_ptr<IType> TOUCA_CLIENT_API
        deserializeValue(const fbs::TypeWrapper* ptr);

    } // namespace types
} // namespace touca
