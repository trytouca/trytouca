/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include <weasel/detail/client.hpp>
#include <weasel/devkit/httpclient.hpp>
#include <weasel/devkit/utils.hpp>
#include <weasel/weasel.hpp>

namespace weasel {

    static ClientImpl instance;
    static GlobalHttp globalHttp;

    /**
     *
     */
    void configure(const ClientImpl::OptionsMap& opts)
    {
        return instance.configure(opts);
    }

    /**
     *
     */
    void configure(const weasel::path& path)
    {
        return instance.configureByFile(path);
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
    void declare_testcase(const std::string& name)
    {
        instance.testcase(name);
    }

    /**
     *
     */
    void declare_testcase(const std::wstring& name)
    {
        instance.testcase(weasel::toUtf8(name));
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
        instance.forget_testcase(weasel::toUtf8(name));
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
            instance.add_result(weasel::toUtf8(key), value);
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
            instance.add_assertion(weasel::toUtf8(key), value);
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
            instance.add_array_element(weasel::toUtf8(key), value);
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
    scoped_timer make_timer(const std::string& key)
    {
        return scoped_timer(key);
    }

    /**
     *
     */
    void save_binary(
        const weasel::path& path,
        const std::vector<std::string>& testcases,
        const bool overwrite)
    {
        return instance.save(path, testcases, DataFormat::FBS, overwrite);
    }

    /**
     *
     */
    void save_json(
        const weasel::path& path,
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
    scoped_timer::scoped_timer(const std::string& name)
        : _name(name)
    {
        start_timer(_name);
    }

    /**
     *
     */
    scoped_timer::~scoped_timer()
    {
        stop_timer(_name);
    }

} // namespace weasel
