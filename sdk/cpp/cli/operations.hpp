// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <memory>
#include <string>
#include <unordered_map>

struct Operation {
  enum class Command { compare, unknown, view };

  static Command find_mode(const std::string& name);

  static std::shared_ptr<Operation> make(const Command& mode);

  virtual bool parse(int argc, char* argv[]) final;

  virtual bool run() const final;

 protected:
  virtual ~Operation() = default;

 private:
  virtual bool parse_impl(int argc, char* argv[]) = 0;

  virtual bool run_impl() const = 0;
};

struct CliOptions {
  bool show_help = false;
  bool show_version = false;
  Operation::Command mode = Operation::Command::unknown;

  bool parse(int argc, char* argv[]);

 private:
  bool parse_impl(int argc, char* argv[]);
};

struct ViewOperation : public Operation {
 protected:
  bool parse_impl(int argc, char* argv[]) override;

  bool run_impl() const override;

 private:
  std::string _src;
};

struct CompareOperation : public Operation {
 protected:
  bool parse_impl(int argc, char* argv[]) override;

  bool run_impl() const override;

 private:
  std::string _src;
  std::string _dst;
};

void print_error(const std::string& msg);
