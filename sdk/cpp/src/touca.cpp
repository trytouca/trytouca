// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/touca.hpp"
#include "touca/detail/client.hpp"
#include "touca/devkit/utils.hpp"

namespace touca {

    static ClientImpl instance;

    /**
     *
     */
    void configure(const ClientImpl::OptionsMap& opts)
    {
        instance.configure(opts);
    }

    /**
     *
     */
    void configure(const std::string& path)
    {
        instance.configure_by_file(path);
    }

    /**
     *
     */
    bool is_configured()
    {
        return instance.is_configured();
    }

    /**
     *
     */
    std::string configuration_error()
    {
        return instance.configuration_error();
    }

    /**
     *
     */
    void add_logger(const std::shared_ptr<logger> logger)
    {
        instance.add_logger(logger);
    }

    /**
     *
     */
    std::vector<std::string> get_testcases()
    {
        return instance.get_testcases();
    }

    /**
     *
     */
    void declare_testcase(const std::string& name)
    {
        instance.declare_testcase(name);
    }

    /**
     *
     */
    void declare_testcase(const std::wstring& name)
    {
        instance.declare_testcase(touca::narrow(name));
    }

    /**
     *
     */
    void forget_testcase(const std::string& name)
    {
        instance.forget_testcase(name);
    }

    /**
     *
     */
    void forget_testcase(const std::wstring& name)
    {
        instance.forget_testcase(touca::narrow(name));
    }

    /**
     *
     */
    namespace internal {

        /**
         *
         */
        void add_result(
            const std::string& key,
            const std::shared_ptr<types::IType>& value)
        {
            instance.add_result(key, value);
        }

        /**
         *
         */
        void add_result(
            const std::wstring& key,
            const std::shared_ptr<types::IType>& value)
        {
            instance.add_result(touca::narrow(key), value);
        }

        /**
         *
         */
        void add_assertion(
            const std::string& key,
            const std::shared_ptr<types::IType>& value)
        {
            instance.add_assertion(key, value);
        }

        /**
         *
         */
        void add_assertion(
            const std::wstring& key,
            const std::shared_ptr<types::IType>& value)
        {
            instance.add_assertion(touca::narrow(key), value);
        }

        /**
         *
         */
        void add_array_element(
            const std::string& key,
            const std::shared_ptr<types::IType>& value)
        {
            instance.add_array_element(key, value);
        }

        /**
         *
         */
        void add_array_element(
            const std::wstring& key,
            const std::shared_ptr<types::IType>& value)
        {
            instance.add_array_element(touca::narrow(key), value);
        }

    } // namespace internal

    /**
     *
     */
    void add_hit_count(const std::string& key)
    {
        instance.add_hit_count(key);
    }

    /**
     *
     */
    void add_metric(const std::string& key, const unsigned duration)
    {
        instance.add_metric(key, duration);
    }

    /**
     *
     */
    void start_timer(const std::string& key)
    {
        instance.start_timer(key);
    }

    /**
     *
     */
    void stop_timer(const std::string& key)
    {
        instance.stop_timer(key);
    }

    /**
     *
     */
    void save_binary(
        const std::string& path,
        const std::vector<std::string>& testcases,
        const bool overwrite)
    {
        return instance.save(path, testcases, DataFormat::FBS, overwrite);
    }

    /**
     *
     */
    void save_json(
        const std::string& path,
        const std::vector<std::string>& testcases,
        const bool overwrite)
    {
        return instance.save(path, testcases, DataFormat::JSON, overwrite);
    }

    /**
     *
     */
    bool post()
    {
        return instance.post();
    }

    /**
     *
     */
    bool seal()
    {
        return instance.seal();
    }

} // namespace touca
