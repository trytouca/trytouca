// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
  S3ClientConfig
} from '@aws-sdk/client-s3'

import { config } from './config'
import logger from './logger'

abstract class ObjectStore {
  abstract makeConnection(): Promise<boolean>

  /**
   * Checks whether we have an established connection with the object storage
   * service. Intended for use during server health check.
   *
   * @return true if minio is ready and responsive
   */
  abstract status(): Promise<boolean>

  /**
   * Store comparison result with given id in the object storage.
   *
   * @param id string representation of the document id for this comparison
   * @param content JSON representation of the comparison result to be stored
   */
  protected abstract putDocument(
    type: 'comparisons' | 'messages' | 'results',
    id: string,
    content: string | Buffer
  ): Promise<boolean>

  protected abstract deleteDocument(
    type: 'comparisons' | 'messages' | 'results',
    id: string
  ): Promise<boolean>

  addComparison(id: string, content: string): Promise<boolean> {
    return this.putDocument('comparisons', id, content)
  }
  addMessage(id: string, content: Buffer): Promise<boolean> {
    return this.putDocument('messages', id, content)
  }
  addResult(id: string, content: string): Promise<boolean> {
    return this.putDocument('results', id, content)
  }

  removeComparison(id: string): Promise<boolean> {
    return this.deleteDocument('comparisons', id)
  }
  removeMessage(id: string): Promise<boolean> {
    return this.deleteDocument('messages', id)
  }
  removeResult(id: string): Promise<boolean> {
    return this.deleteDocument('results', id)
  }

  /**
   * copied verbatim from https://stackoverflow.com/a/49428486/5788276
   */
  protected streamToString(stream): Promise<string> {
    const chunks = []
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      stream.on('error', (err) => reject(err))
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
  }
  protected streamToBuffer(stream): Promise<Buffer> {
    const chunks = []
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      stream.on('error', (err) => reject(err))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
    })
  }
}

class S3ObjectStore extends ObjectStore {
  private client: S3Client
  constructor(options: S3ClientConfig) {
    super()
    this.client = new S3Client(options)
  }
  private async missingBuckets(): Promise<string[]> {
    const buckets = ['touca-comparisons', 'touca-messages', 'touca-results']
    const missing = []
    for (const bucket of buckets) {
      try {
        await this.client.send(new HeadBucketCommand({ Bucket: bucket }))
      } catch (err) {
        missing.push(bucket)
      }
    }
    return missing
  }
  async makeConnection(): Promise<boolean> {
    for (const name of await this.missingBuckets()) {
      await this.client.send(new CreateBucketCommand({ Bucket: name }))
    }
    return true
  }
  async status(): Promise<boolean> {
    const missing = await this.missingBuckets()
    return missing.length == 0
  }
  protected async putDocument(
    type: 'comparisons' | 'messages' | 'results',
    id: string,
    content: string | Buffer
  ): Promise<boolean> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Body: content,
          Bucket: `touca-${type}`,
          Key: id
        })
      )
      return true
    } catch (err) {
      logger.warn('failed to store %s: %o', type, err)
      return false
    }
  }
  protected async deleteDocument(
    type: 'comparisons' | 'messages' | 'results',
    id: string
  ): Promise<boolean> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: `touca-${type}`, Key: id })
      )
      return true
    } catch (err) {
      logger.warn('failed to remove document: %o', err)
      return false
    }
  }
  async getComparison(key: string): Promise<string> {
    const data = await this.client.send(
      new GetObjectCommand({ Bucket: `touca-comparisons`, Key: key })
    )
    return this.streamToString(data.Body)
  }
  async getMessage(key: string): Promise<Buffer> {
    const data = await this.client.send(
      new GetObjectCommand({ Bucket: `touca-messages`, Key: key })
    )
    return this.streamToBuffer(data.Body)
  }
}

export const objectStore =
  config.minio.host === 's3.amazonaws.com'
    ? new S3ObjectStore({ region: config.minio.region })
    : new S3ObjectStore({
        credentials: {
          accessKeyId: config.minio.user,
          secretAccessKey: config.minio.pass
        },
        endpoint: {
          protocol: 'http',
          hostname: config.minio.host,
          port: config.minio.port,
          path: '/'
        },
        forcePathStyle: true,
        region: config.minio.region
      })
