// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'

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
    accessKeyId: string
    secretAccessKey: string
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
  }
  tracking: {
    hubspot_key: string
    hubspot_token: string
    mixpanel: string
  }
  webapp: {
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
    cookieSecret: env.AUTH_COOKIE_SECRET,
    googleClientId: env.AUTH_GOOGLE_CLIENT_ID,
    jwtLifetime: 30,
    jwtLifetimeClient: 1,
    jwtSecret: env.AUTH_JWT_SECRET,
    maxLoginAttempts: 3,
    maxResetKeyLifetime: 30
  },
  aws: {
    region: env.AWS_REGION || 'us-east-2',
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_ACCESS_KEY_SECRET,
    lambdaPdf: env.AWS_LAMBDA_PDF_GENERATOR
  },
  isCloudHosted: env.DEPLOY_MODE === 'cloud_hosted',
  env: env.NODE_ENV,
  express: {
    port: Number(env.EXPRESS_PORT),
    root: env.EXPRESS_ROOT
  },
  logging: {
    directory: path.normalize(`${__dirname}/../../` + env.LOG_DIR),
    filename: env.LOG_FILENAME,
    level: env.LOG_LEVEL
  },
  mail: {
    host: env.MAIL_TRANSPORT_HOST,
    pass: env.MAIL_TRANSPORT_PASS || '',
    port: Number(env.MAIL_TRANSPORT_PORT),
    templatesDirectory: env.MAIL_TEMPLATE_DIR,
    user: env.MAIL_TRANSPORT_USER
  },
  minio: {
    host: env.MINIO_HOST,
    pass: env.MINIO_PASS,
    port: Number(env.MINIO_PORT),
    user: env.MINIO_USER,
    region: env.MINIO_REGION || 'us-east-2'
  },
  mongo: {
    database: env.MONGO_BASE,
    host: env.MONGO_HOST,
    pass: env.MONGO_PASS,
    port: Number(env.MONGO_PORT),
    tlsCertificateFile: env.MONGO_TLS_CERT_FILE,
    user: env.MONGO_USER
  },
  redis: {
    database: env.REDIS_BASE,
    durationLong: Number(env.CACHE_DURATION_LONG),
    durationShort: Number(env.CACHE_DURATION_SHORT),
    host: env.REDIS_HOST,
    port: Number(env.REDIS_PORT),
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
    }
  },
  tracking: {
    hubspot_key: env.HUBSPOT_API_KEY,
    hubspot_token: env.HUBSPOT_ACCESS_TOKEN,
    mixpanel: env.MIXPANEL_PROJECT_TOKEN
  },
  webapp: {
    root: env.WEBAPP_ROOT
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
  public hasMailTransport(): boolean {
    return ['user', 'host', 'port'].every((key) => config.mail[key])
  }
}

export const configMgr = new ConfigManager(config)
