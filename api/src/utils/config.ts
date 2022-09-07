// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import dotenv from 'dotenv'
import { RedisOptions } from 'ioredis'
import { pick } from 'lodash'
import mongoose from 'mongoose'
import path from 'path'

import { MetaModel } from '@/schemas/meta'

interface IConfig {
  auth: {
    activationKeyLength: number
    bcryptSaltRound: number
    cookieSecret: string
    googleClientId: string
    jwtLifetime: number // in days
    jwtLifetimeClient: number // in days
    jwtSecret: string
    maxLoginAttempts: number
    maxResetKeyLifetime: number // in minutes
  }
  aws: {
    region: string
    lambdaPdf: string
  }
  isCloudHosted: boolean
  env: string
  express: {
    port: number
    root: string
  }
  logging: {
    directory: string
    filename: string
    level: string
  }
  mail: {
    host: string
    pass: string
    port: number
    templatesDirectory: string
    user: string
  }
  minio: {
    host: string
    pass: string
    port: number
    user: string
    region: string
  }
  mongo: {
    database: string
    host: string
    pass: string
    port: number
    tlsCertificateFile?: string
    user: string
  }
  redis: {
    database: string
    durationLong: number
    durationShort: number
    host: string
    port: number
    tlsCertificateFile?: string
  }
  samples: {
    directory: string
    enabled: boolean
  }
  services: {
    analytics: {
      checkInterval: number
    }
    autoseal: {
      checkInterval: number
      defaultDuration: number
    }
    reporting: {
      checkInterval: number
    }
    retention: {
      checkInterval: number
      defaultDuration: number
      resultLifetime: number
    }
    telemetry: {
      checkInterval: number
      defaultDuration: number
    }
  }
  tracking: {
    hubspot_key: string
    hubspot_token: string
    orbit_key: string
    segment_key: string
  }
  webapp: {
    distDirectory: string
    root: string
  }
}

function findPath(environment = '') {
  const name = environment === '' ? '.env' : `.env.${environment}`
  return path.normalize(`${__dirname}/../../env/${name}`)
}

dotenv.config({ path: findPath() })
dotenv.config({ path: findPath(process.env.ENV_FILE) })

const env = process.env
export const config: IConfig = {
  auth: {
    activationKeyLength: 8,
    bcryptSaltRound: 10,
    cookieSecret: env.AUTH_COOKIE_SECRET || 'cookiesecret',
    googleClientId: env.AUTH_GOOGLE_CLIENT_ID,
    jwtLifetime: 30,
    jwtLifetimeClient: 1,
    jwtSecret: env.AUTH_JWT_SECRET || 'jwtsecret',
    maxLoginAttempts: 3,
    maxResetKeyLifetime: 30
  },
  aws: {
    region: env.AWS_REGION || 'us-east-2',
    lambdaPdf: env.AWS_LAMBDA_PDF_GENERATOR
  },
  isCloudHosted: env.DEPLOY_MODE === 'cloud_hosted',
  env: env.NODE_ENV,
  express: {
    port: Number(env.EXPRESS_PORT) || 8080,
    root: env.EXPRESS_ROOT
  },
  logging: {
    directory: path.normalize(`${__dirname}/../../` + env.LOG_DIR),
    filename: env.LOG_FILENAME,
    level: env.LOG_LEVEL || 'info'
  },
  mail: {
    host: env.MAIL_TRANSPORT_HOST,
    pass: env.MAIL_TRANSPORT_PASS || '',
    port: Number(env.MAIL_TRANSPORT_PORT) || 587,
    templatesDirectory: env.MAIL_TEMPLATE_DIR,
    user: env.MAIL_TRANSPORT_USER
  },
  minio: {
    host: env.MINIO_HOST,
    pass: env.MINIO_PASS || 'toucapass',
    port: Number(env.MINIO_PORT) || 9000,
    user: env.MINIO_USER || 'toucauser',
    region: env.MINIO_REGION || 'us-east-2'
  },
  mongo: {
    database: env.MONGO_BASE || 'touca',
    host: env.MONGO_HOST,
    pass: env.MONGO_PASS || 'toucapass',
    port: Number(env.MONGO_PORT) || 27017,
    tlsCertificateFile: env.MONGO_TLS_CERT_FILE,
    user: env.MONGO_USER || 'toucauser'
  },
  redis: {
    database: env.REDIS_BASE || 'touca',
    durationLong: Number(env.CACHE_DURATION_LONG) || 1800,
    durationShort: Number(env.CACHE_DURATION_SHORT) || 60,
    host: env.REDIS_HOST,
    port: Number(env.REDIS_PORT) || 6379,
    tlsCertificateFile: env.REDIS_TLS_CERT_FILE
  },
  samples: {
    directory: path.normalize(`${__dirname}/../../` + env.SAMPLES_DIR),
    enabled: env.SAMPLES_ENABLED === 'true'
  },
  services: {
    // analytics service
    analytics: {
      checkInterval: Number(env.SERVICE_ANALYTICS_CHECK_INTERVAL) || 30
    },
    // auto-seal service
    autoseal: {
      checkInterval: Number(env.SERVICE_AUTOSEAL_CHECK_INTERVAL) || 60,
      defaultDuration: Number(env.SERVICE_AUTOSEAL_DEFAULT_DURATION) || 10 * 60
    },
    // reporting service
    reporting: {
      checkInterval: Number(env.SERVICE_REPORTING_CHECK_INTERVAL) || 5 * 60
    },
    // data retention service
    retention: {
      checkInterval: Number(env.SERVICE_RETENTION_CHECK_INTERVAL) || 30 * 60,
      defaultDuration:
        Number(env.SERVICE_RETENTION_DEFAULT_DURATION) || 63072000,
      // comparison result lifetime
      resultLifetime:
        Number(env.SERVICE_RETENTION_DEFAULT_RESULT_LIFETIME) || 30 * 86400
    },
    telemetry: {
      checkInterval: Number(env.SERVICE_TELEMETRY_CHECK_INTERVAL) || 30 * 60,
      defaultDuration: Number(env.SERVICE_TELEMETRY_DEFAULT_DURATION) || 86400
    }
  },
  tracking: {
    hubspot_key: env.HUBSPOT_API_KEY,
    hubspot_token: env.HUBSPOT_ACCESS_TOKEN,
    orbit_key: env.ORBIT_API_KEY,
    segment_key: env.SEGMENT_API_KEY
  },
  webapp: {
    distDirectory: path.resolve(`${__dirname}/../`, env.WEBAPP_DIST_DIRECTORY),
    root: env.WEBAPP_ROOT
  }
}

export function getRedisConnectionOptions(): RedisOptions {
  const cloudOptions = config.redis.tlsCertificateFile
    ? {
        tls: {
          checkServerIdentity: () => undefined
        }
      }
    : {}

  return {
    host: config.redis.host,
    lazyConnect: true,
    port: config.redis.port,
    showFriendlyErrorStack: config.env !== 'production',
    ...cloudOptions
  }
}

class ConfigManager {
  constructor(private data: IConfig) {}
  public getMongoUri(): string {
    const m = this.data.mongo
    return `mongodb://${m.user}:${m.pass}@${m.host}:${m.port}/${m.database}`
  }
  public getMongoConnectionOptions(): mongoose.ConnectOptions {
    const file = this.data.mongo.tlsCertificateFile
    return file
      ? {
          autoIndex: false,
          retryWrites: false,
          sslValidate: false,
          tls: true,
          tlsCAFile: file
        }
      : { autoIndex: false }
  }
  public getRedisUri(): string {
    const redis = this.data.redis
    return `redis://${redis.host}:${redis.port}/${redis.database}`
  }
  public async hasMailTransport(): Promise<boolean> {
    return !!(await MetaModel.countDocuments({
      'mail.host': { $exists: true, $ne: '' }
    }))
  }
  public hasMailTransportEnvironmentVariables() {
    return Object.values(
      pick(config.mail, ['host', 'pass', 'port', 'user'])
    ).every((v) => v)
  }
}

export const configMgr = new ConfigManager(config)
