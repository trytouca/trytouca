// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

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
  using Headers = std::vector<std::pair<std::string, std::string>>;
  virtual void configure(const std::string& api_key,
                         const std::string& api_url) = 0;
  virtual Response get(const std::string& route) const = 0;
  virtual Response patch(const std::string& route,
                         const std::string& body = "") const = 0;
  virtual Response post(const std::string& route,
                        const std::string& body = "") const = 0;
  virtual Response binary(const std::string& route, const std::string& content,
                          const Headers& headers = {}) const = 0;
  virtual ~Transport() = default;
};

struct DefaultTransport : public Transport {
  void configure(const std::string& api_key, const std::string& api_url);
  Response get(const std::string& route) const;
  Response patch(const std::string& route, const std::string& body = "") const;
  Response post(const std::string& route, const std::string& body = "") const;
  Response binary(const std::string& route, const std::string& content,
                  const Headers& headers) const;
  DefaultTransport();
  ~DefaultTransport();

 private:
  ApiUrl _api_url;
  std::unique_ptr<httplib::Client> _cli;
};

}  // namespace touca
