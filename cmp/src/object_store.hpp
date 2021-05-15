/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#pragma once

#include "options.hpp"
#include <memory>
#include <vector>

namespace Aws {
    class SDKOptions;
    namespace S3 {
        class S3Client;
    }
}

namespace touca {
    class Testcase;
}

/**
 *
 */
struct MinioClient {
    MinioClient(const Options& options);
    ~MinioClient();
    std::vector<std::string> list_buckets() const;
    void get_object(
        const std::string& bucket_name,
        const std::string& object_key,
        std::vector<uint8_t>& buffer) const;

private:
    std::unique_ptr<Aws::S3::S3Client> _aws_client;
    std::unique_ptr<Aws::SDKOptions> _aws_sdk_options;
};

/**
 *
 */
struct ObjectStore {
    ObjectStore(const Options& options);
    bool status_check() const;
    std::shared_ptr<touca::Testcase> get_message(const std::string& key) const;
    static ObjectStore& get_instance(const Options& options);

private:
    MinioClient _minio;
};
