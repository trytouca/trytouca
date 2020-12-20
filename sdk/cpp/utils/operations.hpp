/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "boost/program_options.hpp"
#include "boost/program_options/options_description.hpp"
#include <weasel/devkit/options.hpp>

/**
 *
 */
class Operation
{
public:
    /**
     *
     */
    enum class Mode
    {
        Compare,
        Merge,
        Post,
        Unknown,
        Update,
        View
    };
    bool parse(int argc, char* argv[]);
    bool validate() const;
    bool execute() const;
    virtual boost::program_options::options_description description() const = 0;
    virtual bool run() const = 0;
    static std::shared_ptr<Operation> detect(int argc, char* argv[]);

protected:
    Operation();
    virtual ~Operation() = default;
    virtual bool validate_options() const;
    virtual void parse_options(const boost::program_options::variables_map vm);

    /**
     * Helper function for use by derived classes that wish to implement
     * validate_options.
     */
    bool validate_required_keys(
        const std::initializer_list<std::string>& keys) const;

    /**
     * Helper function for use by derived classes that wish to implement
     * parse_options.
     */
    void parse_basic_options(
        const boost::program_options::variables_map& vm,
        const std::vector<std::string>& keys);

    weasel::Options<std::string> _opts;
};

/**
 *
 */
class HelpOperation : public Operation
{
public:
    HelpOperation();
    boost::program_options::options_description description() const override;
    bool run() const override;
};

/**
 *
 */
class CompareOperation : public Operation
{
public:
    CompareOperation();
    boost::program_options::options_description description() const override;
    bool run() const override;
    bool validate_options() const override;

protected:
    void parse_options(const boost::program_options::variables_map vm) override;
};

/**
 *
 */
class MergeOperation : public Operation
{
public:
    MergeOperation();
    boost::program_options::options_description description() const override;
    bool run() const override;
    bool validate_options() const override;

protected:
    void parse_options(const boost::program_options::variables_map vm) override;
};

/**
 *
 */
class PostOperation : public Operation
{
public:
    PostOperation();
    boost::program_options::options_description description() const override;
    bool run() const override;
    bool validate_options() const override;

protected:
    void parse_options(const boost::program_options::variables_map vm) override;
};

/**
 *
 */
class UpdateOperation : public Operation
{
public:
    UpdateOperation();
    boost::program_options::options_description description() const override;
    bool run() const override;
    bool validate_options() const override;

protected:
    void parse_options(const boost::program_options::variables_map vm) override;
};

/**
 *
 */
class ViewOperation : public Operation
{
public:
    ViewOperation();
    boost::program_options::options_description description() const override;
    bool run() const override;
    bool validate_options() const override;

protected:
    void parse_options(const boost::program_options::variables_map vm) override;
};
