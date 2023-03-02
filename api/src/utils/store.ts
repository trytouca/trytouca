// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
  S3Client,
  S3ClientConfig
} from '@aws-sdk/client-s3'

import { config } from './config.js'
import { logger } from './logger.js'

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
    type: 'artifacts' | 'comparisons' | 'messages' | 'results',
    path: string,
    content: string | Buffer
  ): Promise<boolean>

  protected abstract deleteDocument(Key: string): Promise<boolean>

  addArtifact(path: string, content: Buffer): Promise<boolean> {
    return this.putDocument('artifacts', path, content)
  }
  addComparison(id: string, content: string): Promise<boolean> {
    return this.putDocument('comparisons', id, content)
  }
  addMessage(id: string, content: Buffer): Promise<boolean> {
    return this.putDocument('messages', id, content)
  }
  addResult(id: string, content: string): Promise<boolean> {
    return this.putDocument('results', id, content)
  }

  removeArtifact(id: string, name: string) {
    return this.deleteDocument(`artifacts/${id}/${name}`)
  }
  removeComparison(id: string): Promise<boolean> {
    return this.deleteDocument(`comparisons/${id}`)
  }
  removeMessage(id: string): Promise<boolean> {
    return this.deleteDocument(`messages/${id}`)
  }
  removeResult(id: string): Promise<boolean> {
    return this.deleteDocument(`results/${id}`)
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
  private async bucketExists(name: string): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: name }))
      return true
    } catch (err) {
      return false
    }
  }
  async makeConnection(): Promise<boolean> {
    if (!(await this.bucketExists('touca'))) {
      await this.client.send(new CreateBucketCommand({ Bucket: 'touca' }))
    }
    return true
  }
  async status(): Promise<boolean> {
    return this.bucketExists('touca')
  }
  protected async putDocument(
    type: 'artifacts' | 'comparisons' | 'messages' | 'results',
    path: string,
    content: string | Buffer
  ): Promise<boolean> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Body: content,
          Bucket: 'touca',
          Key: `${type}/${path}`
        })
      )
      return true
    } catch (err) {
      logger.warn('failed to store %s: %o', type, err)
      return false
    }
  }
  protected async deleteDocument(Key: string): Promise<boolean> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: 'touca', Key }))
      return true
    } catch (err) {
      logger.warn('failed to remove document: %o', err)
      return false
    }
  }
  async getComparison(key: string): Promise<string> {
    const data = await this.client.send(
      new GetObjectCommand({ Bucket: 'touca', Key: `comparisons/${key}` })
    )
    return this.streamToString(data.Body)
  }
  async getMessage(key: string): Promise<Buffer> {
    const data = await this.client.send(
      new GetObjectCommand({ Bucket: 'touca', Key: `messages/${key}` })
    )
    return this.streamToBuffer(data.Body)
  }
  async getArtifact(key: string): Promise<Buffer> {
    const data = await this.client.send(
      new GetObjectCommand({ Bucket: 'touca', Key: `artifacts/${key}` })
    )
    return this.streamToBuffer(data.Body)
  }
  async upgradeBuckets() {
    if (!config.isCloudHosted) {
      this.upgradeBucket('comparisons')
      this.upgradeBucket('messages')
      this.upgradeBucket('results')
    }
  }
  private async upgradeBucket(suffix: string) {
    if (!(await this.bucketExists(`touca-${suffix}`))) {
      return
    }
    let comparisons: ListObjectsV2CommandOutput
    do {
      comparisons = await this.client.send(
        new ListObjectsV2Command({ Bucket: `touca-${suffix}` })
      )
      if (!comparisons.Contents) {
        break
      }
      for (const obj of comparisons.Contents) {
        const data = await this.client.send(
          new GetObjectCommand({
            Bucket: `touca-${suffix}`,
            Key: obj.Key
          })
        )
        const transform =
          suffix === 'messages' ? this.streamToBuffer : this.streamToString
        await this.putDocument(
          suffix as 'comparisons' | 'messages' | 'results',
          obj.Key,
          await transform(data.Body)
        )
        await this.client.send(
          new DeleteObjectCommand({
            Bucket: `touca-${suffix}`,
            Key: obj.Key
          })
        )
      }
    } while (comparisons.KeyCount !== 0)
    await this.client.send(
      new DeleteBucketCommand({ Bucket: `touca-${suffix}` })
    )
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
        endpoint: `http://${config.minio.host}:${config.minio.port}/`,
        forcePathStyle: true,
        region: config.minio.region
      })
