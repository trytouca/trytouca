// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#include "touca/cmp/object_store.hpp"

#include "aws/core/Aws.h"
#include "aws/core/auth/AWSCredentialsProvider.h"
#include "aws/s3/S3Client.h"
#include "aws/s3/model/GetObjectRequest.h"
#include "aws/s3/model/HeadBucketRequest.h"
#include "fmt/core.h"
#include "touca/cmp/logger.hpp"
#include "touca/core/testcase.hpp"
#include "touca/devkit/deserialize.hpp"

MinioClient::MinioClient(const Options& options) {
  _aws_sdk_options = std::make_unique<Aws::SDKOptions>();
  if (options.log_level == "debug") {
    _aws_sdk_options->loggingOptions.logLevel =
        Aws::Utils::Logging::LogLevel::Trace;
  }
  Aws::InitAPI(*_aws_sdk_options);

  Aws::Client::ClientConfiguration aws_config;
  aws_config.region = options.minio_region;

  if (options.minio_url == "https://s3.amazonaws.com") {
    _aws_client = std::make_unique<Aws::S3::S3Client>(aws_config);
    return;
  }

  setenv("AWS_REGION", options.minio_region.c_str(), true);
  setenv("AWS_EC2_METADATA_DISABLED", "TRUE", true);

  if (!options.minio_proxy_host.empty()) {
    aws_config.proxyHost = options.minio_proxy_host;
    aws_config.proxyPort = options.minio_proxy_port;
  }
  aws_config.endpointOverride = options.minio_url;
  aws_config.scheme = Aws::Http::Scheme::HTTP;
  aws_config.verifySSL = false;

  Aws::Auth::AWSCredentials aws_credentials(options.minio_user,
                                            options.minio_pass);
  _aws_client = std::make_unique<Aws::S3::S3Client>(
      aws_credentials, aws_config,
      Aws::Client::AWSAuthV4Signer::PayloadSigningPolicy::Never, false);
}

MinioClient::~MinioClient() { Aws::ShutdownAPI(*_aws_sdk_options); }

bool MinioClient::status_check() const {
  for (const std::string& name :
       {"touca-comparisons", "touca-messages", "touca-results"}) {
    Aws::S3::Model::HeadBucketRequest request;
    request.WithBucket(name);
    const auto& outcome = _aws_client->HeadBucket(request);
    if (!outcome.IsSuccess()) {
      return false;
    }
  }
  return true;
}

void MinioClient::get_object(const std::string& bucket_name,
                             const std::string& object_key,
                             std::vector<uint8_t>& buffer) const {
  Aws::S3::Model::GetObjectRequest object_request;
  object_request.SetBucket(bucket_name);
  object_request.SetKey(object_key);

  auto outcome = _aws_client->GetObject(object_request);
  if (!outcome.IsSuccess()) {
    touca::log_warn("{}: {}", object_key, outcome.GetError().GetMessage());
    return;
  }

  auto&& result = outcome.GetResultWithOwnership();
  auto& result_body = result.GetBody();
  buffer.resize(result.GetContentLength());
  result_body.read((char*)&buffer[0], buffer.size());
}

ObjectStore::ObjectStore(const Options& options)
    : _minio(MinioClient(options)) {}

bool ObjectStore::status_check() const { return _minio.status_check(); }

std::shared_ptr<touca::Testcase> ObjectStore::get_message(
    const std::string& key) const {
  std::vector<uint8_t> buffer;
  _minio.get_object("touca-messages", key, buffer);

  if (buffer.size() == 0) {
    touca::log_warn("{}: failed to retrieve object", key);
    return nullptr;
  }

  try {
    return std::make_shared<touca::Testcase>(
        touca::deserialize_testcase(buffer));
  } catch (const std::exception& ex) {
    touca::log_warn("{}: failed to parse object: {}", key, ex.what());
  }

  return nullptr;
}

ObjectStore& ObjectStore::get_instance(const Options& options) {
  static ObjectStore store(options);
  return store;
}
