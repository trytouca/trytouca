/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Client } from 'minio'

import { config } from './config'
import logger from './logger'

const minioClient = new Client({
  endPoint: config.minio.host,
  port: config.minio.port,
  useSSL: false,
  accessKey: config.minio.user,
  secretKey: config.minio.pass
})

const bucketNames = {
  comparisons: 'weasel-comparisons',
  messages: 'weasel-messages',
  results: 'weasel-results'
}

/**
 *
 */
export async function makeConnectionMinio(): Promise<boolean> {
  for (const name of Object.values(bucketNames)) {
    if (!(await minioClient.bucketExists(name))) {
      await minioClient.makeBucket(name, config.minio.region)
    }
  }
  return true
}

/**
 *
 *
 * @param comparisonId string representation of the comparison id
 * @param content JSON representation of the comparison result to be stored
 */
export async function addComparison(comparisonId: string, content: string) {
  try {
    await minioClient.putObject(bucketNames.comparisons, comparisonId, content)
    return true
  } catch (err) {
    logger.warn('failed to store comparison: %o', err)
    return false
  }
}

/**
 * Stores binary representation of a message into our object storage database.
 *
 * @param messageId string representation of the document id of this message
 * @param content submitted message to be stored
 */
export async function addMessage(
  messageId: string,
  content: Buffer
): Promise<boolean> {
  try {
    await minioClient.putObject(bucketNames.messages, messageId, content)
    return true
  } catch (err) {
    logger.warn('failed to store message: %o', err)
    return false
  }
}

/**
 * Store JSON representation of a message into our object storage database.
 *
 * @param messageId string representation of the document id of this message
 * @param content JSON representation of the submitted message to be stored
 */
export async function addResult(
  messageId: string,
  content: string
): Promise<boolean> {
  try {
    await minioClient.putObject(bucketNames.results, messageId, content)
    return true
  } catch (err) {
    logger.warn('failed to store result: %o', err)
    return false
  }
}

/**
 * copied verbatim from https://stackoverflow.com/a/49428486/5788276
 */
function streamToString(stream): Promise<string> {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('error', (err) => reject(err))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

export async function getComparison(comparisonId: string): Promise<string> {
  const readable = await minioClient.getObject(
    bucketNames.comparisons,
    comparisonId
  )
  return await streamToString(readable)
}

export async function removeComparison(comparisonId: string): Promise<boolean> {
  try {
    await minioClient.removeObject(bucketNames.comparisons, comparisonId)
    return true
  } catch (err) {
    logger.warn('failed to remove message: %o', err)
    return false
  }
}

export async function removeMessage(messageId: string): Promise<boolean> {
  try {
    await minioClient.removeObject(bucketNames.messages, messageId)
    return true
  } catch (err) {
    logger.warn('failed to remove message: %o', err)
    return false
  }
}

export async function removeResult(messageId: string): Promise<boolean> {
  try {
    await minioClient.removeObject(bucketNames.results, messageId)
    return true
  } catch (err) {
    logger.warn('failed to remove result: %o', err)
    return false
  }
}

/**
 * Checks whether Weasel Platform has an established connection with
 * Weasel minio instance.
 * Intended for use during platform health check.
 *
 * @return true if minio is ready and responsive
 */
export async function status() {
  try {
    for (const name of Object.values(bucketNames)) {
      if (!(await minioClient.bucketExists(name))) {
        return false
      }
    }
    return true
  } catch (err) {
    logger.error('error: %o', err)
    return false
  }
}
