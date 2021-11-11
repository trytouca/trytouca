// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

#include "object_store.hpp"

#include "aws/core/Aws.h"
#include "aws/core/auth/AWSCredentialsProvider.h"
#include "aws/s3/S3Client.h"
#include "aws/s3/model/GetObjectRequest.h"
#include "fmt/core.h"
#include "logger.hpp"
#include "touca/devkit/testcase.hpp"

MinioClient::MinioClient(const Options& options) {
  setenv("AWS_REGION", options.minio_region.c_str(), true);
  setenv("AWS_EC2_METADATA_DISABLED", "TRUE", true);

  _aws_sdk_options = std::make_unique<Aws::SDKOptions>();
  if (options.log_level == "debug") {
    _aws_sdk_options->loggingOptions.logLevel =
        Aws::Utils::Logging::LogLevel::Trace;
  }
  Aws::InitAPI(*_aws_sdk_options);

  Aws::Client::ClientConfiguration aws_config;
  aws_config.endpointOverride = options.minio_url;
  if (!options.minio_proxy_host.empty()) {
    aws_config.proxyHost = options.minio_proxy_host;
    aws_config.proxyPort = options.minio_proxy_port;
  }
  aws_config.region = options.minio_region;
  aws_config.scheme = Aws::Http::Scheme::HTTP;
  aws_config.verifySSL = false;

  Aws::Auth::AWSCredentials aws_credentials(options.minio_user,
                                            options.minio_pass);
  const auto policy = Aws::Client::AWSAuthV4Signer::PayloadSigningPolicy::Never;
  _aws_client = std::make_unique<Aws::S3::S3Client>(aws_credentials, aws_config,
                                                    policy, false);
}

MinioClient::~MinioClient() { Aws::ShutdownAPI(*_aws_sdk_options); }

std::vector<std::string> MinioClient::list_buckets() const {
  std::vector<std::string> bucket_names;
  const auto& outcome = _aws_client->ListBuckets();
  if (outcome.IsSuccess()) {
    const auto& buckets = outcome.GetResult().GetBuckets();
    for (const auto& bucket : buckets) {
      bucket_names.push_back(bucket.GetName());
    }
  }
  return bucket_names;
}

void MinioClient::get_object(const std::string& bucket_name,
                             const std::string& object_key,
                             std::vector<uint8_t>& buffer) const {
  Aws::S3::Model::GetObjectRequest object_request;
  object_request.SetBucket(bucket_name);
  object_request.SetKey(object_key);
  auto outcome = _aws_client->GetObject(object_request);
  if (!outcome.IsSuccess()) {
    touca::log_warn("{}: failed to retrieve object: {}", object_key,
                    outcome.GetError().GetMessage());
  }

  auto&& result = outcome.GetResultWithOwnership();
  auto& result_body = result.GetBody();
  buffer.resize(result.GetContentLength());
  result_body.read((char*)&buffer[0], buffer.size());
}

ObjectStore::ObjectStore(const Options& options)
    : _minio(MinioClient(options)) {}

bool ObjectStore::status_check() const {
  const auto& buckets = _minio.list_buckets();
  for (const auto& bucket : buckets) {
    touca::log_debug("accessed bucket: {}", bucket);
  }
  return buckets.size() == 3;
}

std::shared_ptr<touca::Testcase> ObjectStore::get_message(
    const std::string& key) const {
  std::vector<uint8_t> buffer;
  _minio.get_object("touca-messages", key, buffer);

  if (buffer.size() == 0) {
    touca::log_warn("{}: failed to retrieve object", key);
    return nullptr;
  }

  try {
    return std::make_shared<touca::Testcase>(buffer);
  } catch (const std::exception& ex) {
    touca::log_warn("{}: failed to parse object: {}", key, ex.what());
  }

  return nullptr;
}

ObjectStore& ObjectStore::get_instance(const Options& options) {
  static ObjectStore store(options);
  return store;
}
