# Environment Variables

If you are self-hosting Touca, you may be using our
[Docker compose file](https://github.com/trytouca/trytouca/blob/main/ops/docker-compose.prod.yml),
directly or indirectly through our `install.sh` script. This simple setup is
tailored for use by individuals and small engineering teams. It sets up an
instance of the Touca server connected to its service dependencies like MinIO,
MongoDB, and Redis. The server supports a variety of environment variables that
help you change this deployment setup and make it more production-ready. This
document lists all the supported environment variables for your reference.

## Common variables

The following environment variables are secrets used by the Touca server to
connect to its services. While they all have a default value, we recommend that
you set them to a different value when setting up a production instance.

| Variable             | Default      | Purpose                                         |
| -------------------- | ------------ | ----------------------------------------------- |
| `AUTH_COOKIE_SECRET` | cookiesecret | Secret to use when issuing web cookies          |
| `AUTH_JWT_SECRET`    | jwtsecret    | Secret to use when generating JWT tokens        |
| `MINIO_PASS`         | toucapass    | MinIO Password or AWS Secret Key if using S3    |
| `MINIO_USER`         | toucauser    | MinIO Username or AWS Access Key ID if using S3 |
| `MONGO_PASS`         | toucapass    | Password to connect to MongoDB instance         |
| `MONGO_USER`         | toucauser    | Username to connect to MongoDB instance         |

To reconfigure the Touca server with different values for these environment
variables, you can stop any running containers, modify the docker-compose file,
and restart them. Here is a sample configuration for passing `AUTH_JWT_SECRET`
to `touca_api`:

```yaml
version: "3"
services:
  touca_api:
    image: touca/touca-api:1.6.0
    environment:
      ENV_FILE: prod
      AUTH_JWT_SECRET: <SET YOUR SECRET HERE>
    volumes:
      - ./logs/api:/opt/local/logs/api
    depends_on:
      - touca_minio
      - touca_mongo
      - touca_redis
    restart: always
```

## Connecting to other services

In the most common deployment scenarios, the above environment variables are all
that you need to set to make Touca working as you expect. But there are more
configuration parameters that you can set via environment variables, depending
on your deployment setup.

| Variable       | Default            | Purpose                                                                  |
| -------------- | ------------------ | ------------------------------------------------------------------------ |
| `MINIO_HOST`   | touca_minio        | Address to MinIO server. Connects to S3 when set to `s3.amazonaws.com`   |
| `MINIO_PORT`   | 9000               | Port that MinIO instance is running on                                   |
| `MINIO_REGION` | us-east-2          | Region for S3 Bucket when using AWS                                      |
| `MONGO_BASE`   | touca              | MongoDB database name to use for Touca                                   |
| `MONGO_HOST`   | touca_mongo        | Address to MongoDB instance                                              |
| `MONGO_PORT`   | 27017              | Port that MongoDB instance is running on                                 |
| `REDIS_BASE`   | touca              | Name of the base to use when connecting to the Redis instance            |
| `REDIS_HOST`   | touca_redis        | Address to Redis instance                                                |
| `REDIS_PORT`   | 6379               | Port that Redis instance is running on                                   |
| `WEBAPP_ROOT`  | `http://localhost` | Address to Touca web UI used for building URLs to submitted test results |

## Other supported variables

Touca server also supports the following environment variables. It is very rare
that you'd need to set them to a value different than their default value.

| Variable                                    | Default                       |                                                                                                            |
| ------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `EXPRESS_PORT`                              | 8081                          | Port that Touca server should be running on                                                                |
| `EXPRESS_ROOT`                              | /api                          | URL prefix of Touca server API                                                                             |
| `SAMPLES_DIR`                               | samples                       | Directory where sample test results are stored                                                             |
| `SAMPLES_ENABLED`                           | "true"                        | Whether to create a sample Tutorial team for each user account                                             |
| `CACHE_DURATION_LONG`                       | 30 minutes                    | Duration to cache API endpoint responses that barely change                                                |
| `CACHE_DURATION_SHORT`                      | 1 minute                      | Duration to cache API endpoint responses temporarily                                                       |
| `REDIS_TLS_CERT_FILE`                       |                               | Path to TLS Certificate file to use when connecting to the Redis instance                                  |
| `MONGO_TLS_CERT_FILE`                       |                               | Path to TLS Certificate file to use when connecting to the Mongo instance                                  |
| `MAIL_TEMPLATE_DIR`                         | /opt/touca/api/dist/templates | Directory where email template files are stored                                                            |
| `LOG_DIR`                                   | ./local/logs/api              | Directory where log files should be stored                                                                 |
| `LOG_FILENAME`                              | touca_api.log                 | Basename of the rotated log files that the server generates                                                |
| `NODE_ENV`                                  | production                    | Node runtime mode                                                                                          |
| `LOG_LEVEL`                                 | info                          | Level of detail to use when logging server events                                                          |
| `SERVICE_ANALYTICS_CHECK_INTERVAL`          | 30 seconds                    | Duration in seconds after which the analytics service should re-run                                        |
| `SERVICE_AUTOSEAL_CHECK_INTERVAL`           | 1 minute                      | Duration in seconds after which the auto-seal service should re-run                                        |
| `SERVICE_AUTOSEAL_DEFAULT_DURATION`         | 10 minutes                    | Duration in seconds after the test results for a given version is submitted until they are sealed          |
| `SERVICE_REPORTING_CHECK_INTERVAL`          | 5 minutes                     | Duration in seconds after which the reporting service should re-run                                        |
| `SERVICE_RETENTION_CHECK_INTERVAL`          | 30 minutes                    | Duration in seconds after which the data retention service should re-run                                   |
| `SERVICE_RETENTION_DEFAULT_DURATION`        | 2 years                       | Duration in seconds after which the submitted test results for a given version are removed from the server |
| `SERVICE_RETENTION_DEFAULT_RESULT_LIFETIME` | 30 days                       | Duration in seconds to wait before removing a given comparison results                                     |
| `SERVICE_TELEMETRY_CHECK_INTERVAL`          | 30 minutes                    | Duration in seconds after which the telemetry service should re-run                                        |
| `SERVICE_TELEMETRY_DEFAULT_DURATION`        | 1 day                         | Duration in seconds to wait after a submitted telemetry report until another report is submitted           |
| `SERVICE_COMPARISON_ENABLED`                | false                         | Use built-in comparison service instead of Touca Comparator                                                |

## Deprecated variables

These environment variables for SMPT/POP3 server have been deprecated and may be
removed in future versions of the Touca server. We recommend that you switch to
using the Mail Transport tab of the Server Settings page for setting up the mail
server.

| Variable              | Purpose                                  | Default |
| --------------------- | ---------------------------------------- | ------- |
| `MAIL_TRANSPORT_HOST` | Address to SMTP/POP3 server              |         |
| `MAIL_TRANSPORT_PORT` | Port that SMTP/POP3 server is running on | 587     |
| `MAIL_TRANSPORT_USER` | Username to SMTP/POP3 instance           |         |
| `MAIL_TRANSPORT_PASS` | Password to SMTP/POP3 instance           |         |
