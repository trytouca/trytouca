# Environment Variables

Touca server supports a variety of environment variables that help you change
your deployment setup and modify the server behavior. This document lists all
the supported environment variables for your reference.

## Common variables

The following environment variables are secrets used by the Touca server to
connect to its services. While they all have a default value, we recommend that
you set them to a different value when setting up a production instance.

| Variable             | Purpose                                         | Default      |
| -------------------- | ----------------------------------------------- | ------------ |
| `AUTH_COOKIE_SECRET` | Secret to use when issuing web cookies          | cookiesecret |
| `AUTH_JWT_SECRET`    | Secret to use when generating JWT tokens        | jwtsecret    |
| `MINIO_PASS`         | MinIO Password or AWS Secret Key if using S3    | toucapass    |
| `MINIO_USER`         | MinIO Username or AWS Access Key ID if using S3 | toucauser    |
| `MONGO_URI`          | Mongo Connection String URI                     |              |

To reconfigure the Touca server with different values for these environment
variables, you can stop any running containers, modify the docker-compose file,
and restart them. Here is a sample configuration for passing `AUTH_JWT_SECRET`
to `touca_touca`:

```yaml
version: "3"
services:
  touca_touca:
    image: touca/touca:1.8.0
    environment:
      ENV_FILE: prod
      AUTH_JWT_SECRET: <SET YOUR SECRET HERE>
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
| `REDIS_BASE`   | touca              | Name of the base to use when connecting to the Redis instance            |
| `REDIS_HOST`   | touca_redis        | Address to Redis instance                                                |
| `REDIS_PORT`   | 6379               | Port that Redis instance is running on                                   |
| `WEBAPP_ROOT`  | `http://localhost` | Address to Touca web UI used for building URLs to submitted test results |

## Other supported variables

Touca server also supports the following environment variables. It is very rare
that you'd need to set them to a value different than their default value.

| Variable                                    | Default                       |                                                                                                            |
| ------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `EXPRESS_PORT`                              | 8080                          | Port that Touca server should be running on                                                                |
| `EXPRESS_ROOT`                              | /api                          | URL prefix of Touca server API                                                                             |
| `SAMPLES_DIR`                               | samples                       | Directory where sample test results are stored                                                             |
| `SAMPLES_ENABLED`                           | "true"                        | Whether to create a sample Tutorial team for each user account                                             |
| `CACHE_DURATION_LONG`                       | 30 minutes                    | Duration to cache API endpoint responses that barely change                                                |
| `CACHE_DURATION_SHORT`                      | 1 minute                      | Duration to cache API endpoint responses temporarily                                                       |
| `REDIS_TLS_CERT_FILE`                       |                               | Path to TLS Certificate file to use when connecting to the Redis instance                                  |
| `MONGO_TLS_CERT_FILE`                       |                               | Path to TLS Certificate file to use when connecting to the Mongo instance                                  |
| `MAIL_TEMPLATE_DIR`                         | /opt/touca/api/dist/templates | Directory where email template files are stored                                                            |
| `LOG_DIR`                                   |                               | Directory where log files should be stored                                                                 |
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
| `WEBAPP_DIST_DIRECTORY`                     | `/opt/touca/app/dist`         | Path to Touca Web App static files                                                                         |

## Deprecated variables

These environment variables have been deprecated in favor of `MONGO_URI`. They
are ignored if `MONGO_URI` is set.

| Variable     | Purpose                                  | Default     |
| ------------ | ---------------------------------------- | ----------- |
| `MONGO_BASE` | MongoDB database name to use for Touca   | touca       |
| `MONGO_HOST` | Address to MongoDB instance              | touca_mongo |
| `MONGO_PORT` | Port that MongoDB instance is running on | 27017       |
| `MONGO_PASS` | Password to connect to MongoDB instance  | toucapass   |
| `MONGO_USER` | Username to connect to MongoDB instance  | toucauser   |

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
