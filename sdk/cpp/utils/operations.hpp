// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <memory>
#include <string>
#include <unordered_map>

/**
 *
 */
struct Operation {
    /**
     *
     */
    enum class Command {
        compare,
        merge,
        post,
        unknown,
        update,
        view
    };

    /**
     *
     */
    static Command find_mode(const std::string& name);

    /**
     *
     */
    static std::shared_ptr<Operation> make(const Command& mode);

    /**
     *
     */
    virtual bool parse(int argc, char* argv[]) final;

    /**
     *
     */
    virtual bool run() const final;

protected:
    virtual ~Operation() = default;

private:
    /**
     *
     */
    virtual bool parse_impl(int argc, char* argv[]) = 0;

    /**
     *
     */
    virtual bool run_impl() const = 0;
};

/**
 *
 */
struct CliOptions {
    bool show_help = false;
    bool show_version = false;
    std::string log_dir;
    std::string log_level = "warning";
    Operation::Command mode = Operation::Command::unknown;

    /**
     *
     */
    bool parse(int argc, char* argv[]);

private:
    /**
     *
     */
    bool parse_impl(int argc, char* argv[]);
};

/**
 *
 */
struct ViewOperation : public Operation {
protected:
    /**
     *
     */
    bool parse_impl(int argc, char* argv[]) override;

    /**
     *
     */
    bool run_impl() const override;

private:
    std::string _src;
};

/**
 *
 */
struct CompareOperation : public Operation {
protected:
    /**
     *
     */
    bool parse_impl(int argc, char* argv[]) override;

    /**
     *
     */
    bool run_impl() const override;

private:
    std::string _src;
    std::string _dst;
};

/**
 *
 */
struct MergeOperation : public Operation {
protected:
    /**
     *
     */
    bool parse_impl(int argc, char* argv[]) override;

    /**
     *
     */
    bool run_impl() const override;

private:
    std::string _src;
    std::string _out;
};

/**
 *
 */
struct PostOperation : public Operation {
protected:
    /**
     *
     */
    bool parse_impl(int argc, char* argv[]) override;

    /**
     *
     */
    bool run_impl() const override;

private:
    bool _fail_fast;
    std::string _src;
    std::string _api_key;
    std::string _api_url;
};

/**
 *
 */
struct UpdateOperation : public Operation {
protected:
    /**
     *
     */
    bool parse_impl(int argc, char* argv[]) override;

    /**
     *
     */
    bool run_impl() const override;

private:
    std::string _src;
    std::string _out;
    std::unordered_map<std::string, std::string> _fields;
};
