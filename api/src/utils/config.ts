/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import dotenv from 'dotenv'
import path from 'path'

interface IConfig {
  auth: {
    activationKeyLength: number
    bcryptSaltRound: number
    cookieSecret: string
    jwtLifetime: number // in days
    jwtLifetimeClient: number // in days
    jwtSecret: string
    maxLoginAttempts: number
    maxResetKeyLifetime: number // in minutes
  }
  deployMode: 'self_hosted' | 'cloud_hosted'
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
    user: string
  }
  redis: {
    database: string
    durationLong: number
    durationShort: number
    host: string
    port: number
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
    jwtLifetime: 30,
    jwtLifetimeClient: 1,
    jwtSecret: env.AUTH_JWT_SECRET,
    maxLoginAttempts: 3,
    maxResetKeyLifetime: 30
  },
  deployMode:
    env.DEPLOY_MODE === 'cloud_hosted' ? 'cloud_hosted' : 'self_hosted',
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
    user: env.MONGO_USER
  },
  redis: {
    database: env.REDIS_BASE,
    durationLong: Number(env.CACHE_DURATION_LONG),
    durationShort: Number(env.CACHE_DURATION_SHORT),
    host: env.REDIS_HOST,
    port: Number(env.REDIS_PORT)
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
        Number(env.SERVICE_RETENTION_DEFAULT_DURATION) || 2 * 365 * 86400,
      // comparison result lifetime
      resultLifetime:
        Number(env.SERVICE_RETENTION_DEFAULT_RESULT_LIFETIME) || 30 * 86400
    }
  },
  tracking: {
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
  public getRedisUri(): string {
    const redis = this.data.redis
    return `redis://${redis.host}:${redis.port}/${redis.database}`
  }
  public hasMailTransport(): boolean {
    const keys = ['user', 'host', 'port']
    return keys.every(
      (key) => config.mail[key] && config.mail[key] !== '<SECRET>'
    )
  }
}

export const configMgr = new ConfigManager(config)
