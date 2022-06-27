// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Client } from 'minio'

import { config } from './config'
import logger from './logger'

const minioClient = new Client(
  config.minio.host
    ? {
        accessKey: config.minio.user,
        secretKey: config.minio.pass,
        endPoint: config.minio.host,
        useSSL: false
      }
    : {
        accessKey: config.minio.user,
        secretKey: config.minio.pass,
        endPoint: 's3.us-east-2.amazonaws.com',
        region: 'us-east-2',
        useSSL: true
      }
)

const bucketNames = {
  comparisons: 'touca-comparisons',
  messages: 'touca-messages',
  results: 'touca-results'
}

export async function makeConnectionMinio(): Promise<boolean> {
  for (const name of Object.values(bucketNames)) {
    if (!(await minioClient.bucketExists(name))) {
      await minioClient.makeBucket(name, config.minio.region)
    }
  }
  return true
}

/**
 * Store comparison result with given id in the object storage.
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

function streamToBuffer(stream): Promise<Buffer> {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('error', (err) => reject(err))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

async function removeDocument(
  bucketName: string,
  documentId: string
): Promise<boolean> {
  try {
    await minioClient.removeObject(bucketName, documentId)
    return true
  } catch (err) {
    logger.warn('failed to remove document: %o', err)
    return false
  }
}

export async function getComparison(documentId: string): Promise<string> {
  return streamToString(
    await minioClient.getObject(bucketNames.comparisons, documentId)
  )
}

export async function getMessage(documentId: string): Promise<Buffer> {
  return streamToBuffer(
    await minioClient.getObject(bucketNames.messages, documentId)
  )
}

export async function removeComparison(comparisonId: string): Promise<boolean> {
  return removeDocument(bucketNames.comparisons, comparisonId)
}

export async function removeMessage(messageId: string): Promise<boolean> {
  return removeDocument(bucketNames.messages, messageId)
}

export async function removeResult(resultId: string): Promise<boolean> {
  return removeDocument(bucketNames.results, resultId)
}

/**
 * Checks whether we have an established connection with the object storage
 * service. Intended for use during server health check.
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
