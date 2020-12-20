/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "boost/bimap.hpp"
#include "boost/lexical_cast.hpp"
#include "weasel/lib_api.hpp"
#include <iostream>
#include <unordered_map>

namespace weasel {

    /**
     *
     */
    template <class K>
    class WEASEL_CLIENT_API Options
    {
        struct EnumKeyHash
        {
            template <typename T>
            std::size_t operator()(T t) const
            {
                return static_cast<std::size_t>(t);
            }
        };

        template <typename T>
        using HashType = typename std::conditional<
            std::is_enum<T>::value,
            EnumKeyHash,
            std::hash<T>>::type;

    public:
        Options(
            const std::initializer_list<std::pair<K, std::string>> names = {})
        {
            for (const auto& kvp : names)
            {
                _names.insert({ kvp.first, kvp.second });
            }
        }

        /**
         *
         */
        void add(const K& key, const std::string& value)
        {
            _values[key] = value;
        }

        /**
         *
         */
        bool has(const K& key) const
        {
            return 0 != _values.count(key);
        }

        /**
         *
         */
        bool hasName(const std::string& name) const
        {
            return 0 != _names.right.count(name);
        }

        /**
         *
         */
        bool hasNameForKey(const K& key) const
        {
            return 0 != _names.left.count(key);
        }

        /**
         * Indicates whether object holds any configuration parameter.
         *
         * @return true if object has no configuration parameter
         */
        bool empty() const
        {
            return _values.empty();
        }

        /**
         * Retrieves value assigned to a configuration parameter in its
         * final data type.
         *
         * @tparam type to cast value of the configuration param into.
         *         defaults to `std::string`.
         * @param key identifier for the configuration parameter whose
         *            value is asked for.
         * @return value of the requested type associated with the given
         *         key.
         * @throw std::out_of_range if key is not found in the map
         * @throw boost::bad_lexical_cast if parsing value to the given type
         *                                 is not possible.
         */
        template <typename T = std::string>
        T get(const K& key) const
        {
            return boost::lexical_cast<T>(_values.at(key));
        }

        /**
         * Retrieves value assigned to a configuration parameter in its
         * final data type if the parameter exists or the provided default
         * value if it is missing.
         *
         * @tparam type to cast value of the configuration param into.
         * @param key identifier for the configuration parameter whose
         *            value is asked for.
         * @param defaultValue the value to return if key is missing.
         * @return value of the requested type associated with the given
         *         key if it exist or default value if key is missing.
         * @throw std::out_of_range if key is not found in the map
         * @throw boost::bad_lexical_cast if parsing value to the given type
         *                                 is not possible.
         */
        template <typename T>
        T get_or(const K& key, T defaultValue) const
        {
            return has(key) ? get<T>(key) : defaultValue;
        }

        /**
         * Find the subset of keys provided as input that are missing from
         * configuration parameters stored in this object.
         *
         * @param keys set of keys to check whether they have a corresponding
         *        value in the map of config options
         * @return subset of `keys` that are missing from map of config
         *         options held by this container
         */
        std::vector<K> findMissingKeys(
            const std::initializer_list<K>& keys) const
        {
            std::vector<K> missingKeys;
            std::copy_if(
                keys.begin(),
                keys.end(),
                std::back_inserter(missingKeys),
                [this](const K& key) { return !_values.count(key); });
            return missingKeys;
        }

        /**
         *
         *
         * @param name string representation of the configuration parameter
         * @return identifier for the configuration parameter whose
         *            value is asked for.
         */
        K toKey(const std::string& name)
        {
            if (!_names.right.count(name))
            {
                throw std::invalid_argument("key not found for name: " + name);
            }
            return _names.right.at(name);
        }

        /**
         *
         *
         * @param key identifier for the configuration parameter whose
         *            value is asked for.
         * @return string representation of the configuration parameter
         */
        std::string toName(const K& key) const
        {
            if (!_names.left.count(key))
            {
                throw std::invalid_argument("name not defined for key");
            }
            return _names.left.at(key);
        }

    private:
        boost::bimap<K, std::string> _names;
        std::unordered_map<K, std::string, HashType<K>> _values;
    };

    template class Options<std::string>;

} // namespace weasel
