// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/core/transport.hpp"

#include <regex>
#include <sstream>

#include "httplib.h"
#include "rapidjson/document.h"
#include "touca/core/filesystem.hpp"

namespace touca {

void DefaultTransport::set_api_url(const std::string& api_url) {
  const auto& userAgent =
      touca::detail::format("touca-client-cpp/{}.{}.{}", TOUCA_VERSION_MAJOR,
                            TOUCA_VERSION_MINOR, TOUCA_VERSION_PATCH);
  _api_url = ApiUrl(api_url);
  _cli = touca::detail::make_unique<httplib::Client>(_api_url.root.c_str());
  _cli->set_default_headers({{"Accept-Charset", "utf-8"},
                             {"Accept", "application/json"},
                             {"User-Agent", userAgent}});
#ifdef CPPHTTPLIB_OPENSSL_SUPPORT
  _cli->enable_server_certificate_verification(false);
#endif
}

void DefaultTransport::set_token(const std::string& token) {
  _cli->set_bearer_token_auth(token.c_str());
  _has_token = true;
}

Response DefaultTransport::get(const std::string& route) const {
  const auto& result = _cli->Get(_api_url.route(route).c_str());
  if (!result) {
    return {-1, touca::detail::format("failed to submit HTTP GET request to {}",
                                      route)};
  }
  return {result->status, result->body};
}

Response DefaultTransport::patch(const std::string& route,
                                 const std::string& body) const {
  const auto& result =
      _cli->Patch(_api_url.route(route).c_str(), body, "application/json");
  if (!result) {
    return {-1, touca::detail::format(
                    "failed to submit HTTP PATCH request to {}", route)};
  }
  return {result->status, result->body};
}

Response DefaultTransport::post(const std::string& route,
                                const std::string& body) const {
  const auto& result =
      _cli->Post(_api_url.route(route).c_str(), body, "application/json");
  if (!result) {
    return {-1, touca::detail::format(
                    "failed to submit HTTP POST request to {}", route)};
  }
  return {result->status, result->body};
}

Response DefaultTransport::binary(const std::string& route,
                                  const std::string& content) const {
  const auto& result = _cli->Post(_api_url.route(route).c_str(), content,
                                  "application/octet-stream");
  if (!result) {
    return {-1, touca::detail::format(
                    "failed to submit HTTP POST request to {}", route)};
  }
  return {result->status, result->body};
}

DefaultTransport::DefaultTransport() : _api_url(""), _cli(nullptr) {}

DefaultTransport::~DefaultTransport() {}

ApiUrl::ApiUrl(const std::string& api_url) {
  if (api_url.empty()) {
    return;
  }
  const static std::regex pattern(
      R"(^(?:([a-z]+)://)?([^:/?#]+)(?::(\d+))?/?(.*)?$)");
  std::cmatch result;
  if (!std::regex_match(api_url.c_str(), result, pattern)) {
    throw touca::detail::runtime_error(
        touca::detail::format("API URL has invalid format: {}", api_url));
  }

  std::vector<std::string> elements = {result[1], result[2], result[3]};
  const std::string path = result[4];
  if (!path.empty()) {
    const auto index = path.find_last_of('@');
    prefix = path.substr(0, index);
    if (!prefix.empty() && prefix.back() == '/') {
      prefix.pop_back();
    }
    if (index != std::string::npos) {
      extra = path.substr(index + 1);
    }
  }

  root = elements[1];
  if (!elements[0].empty()) {
    root.insert(0, touca::detail::format("{}://", elements[0]));
  }
  if (!elements[2].empty()) {
    root.append(touca::detail::format(":{}", elements[2]));
  }
}

std::string ApiUrl::route(const std::string& path) const {
  return prefix.empty() ? path : "/" + prefix + path;
}

}  // namespace touca
