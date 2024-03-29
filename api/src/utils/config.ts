// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { dirname, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

const thisDirectory = dirname(fileURLToPath(import.meta.url))

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
    tlsCertificateFile?: string
    uri: string
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
  return normalize(`${thisDirectory}/../../env/${name}`)
}

function getMongoConnectionUri() {
  const database = env.MONGO_BASE || 'touca'
  const host = env.MONGO_HOST
  const pass = env.MONGO_PASS || 'toucapass'
  const port = Number(env.MONGO_PORT) || 27017
  const user = env.MONGO_USER || 'toucauser'
  return `mongodb://${user}:${pass}@${host}:${port}/${database}`
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
    directory: env.LOG_DIR
      ? normalize(`${thisDirectory}/../../../${env.LOG_DIR}`)
      : undefined,
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
    tlsCertificateFile: env.MONGO_TLS_CERT_FILE,
    uri: env.MONGO_URI ?? getMongoConnectionUri()
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
    directory: normalize(`${thisDirectory}/../../` + env.SAMPLES_DIR),
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
    orbit_key: env.ORBIT_API_KEY,
    segment_key: env.SEGMENT_API_KEY
  },
  webapp: {
    distDirectory: resolve(`${thisDirectory}/../`, env.WEBAPP_DIST_DIRECTORY),
    root: env.WEBAPP_ROOT
  }
}
