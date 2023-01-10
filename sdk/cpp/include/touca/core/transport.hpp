// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include <memory>
#include <string>
#include <vector>

#include "touca/lib_api.hpp"

namespace httplib {
class Client;
}

namespace touca {

struct Response {
  Response(const int status, const std::string& body)
      : status(status), body(body) {}
  const int status = -1;
  const std::string body;
};

struct TOUCA_CLIENT_API ApiUrl {
  explicit ApiUrl(const std::string& api_url);
  std::string route(const std::string& endpoint) const;

  std::string root;
  std::string prefix;
  std::string extra;
};

struct Transport {
  virtual void set_api_url(const std::string& api_url) = 0;
  virtual void set_token(const std::string& token) = 0;
  virtual Response get(const std::string& route) const = 0;
  virtual Response patch(const std::string& route,
                         const std::string& body = "") const = 0;
  virtual Response post(const std::string& route,
                        const std::string& body = "") const = 0;
  virtual Response binary(const std::string& route,
                          const std::string& content) const = 0;
  virtual ~Transport() = default;
};

struct DefaultTransport : public Transport {
  void set_api_url(const std::string& api_url);
  void set_token(const std::string& token);
  Response get(const std::string& route) const;
  Response patch(const std::string& route, const std::string& body = "") const;
  Response post(const std::string& route, const std::string& body = "") const;
  Response binary(const std::string& route, const std::string& content) const;
  DefaultTransport();
  ~DefaultTransport();

 private:
  ApiUrl _api_url;
  bool _has_token = false;
  std::unique_ptr<httplib::Client> _cli;
};

}  // namespace touca
