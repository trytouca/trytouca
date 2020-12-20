/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Client } from '@elastic/elasticsearch'

import { config } from './config'
import logger from './logger'

const esClient = new Client({
  node: config.elastic.host + ':' + config.elastic.port
})

/**
 *
 */
export async function addComparison(content: Record<string, unknown>) {
  const { body } = await esClient.index({
    index: 'comparisons',
    type: '_doc',
    body: content
  })
  return body.result?.localeCompare('created') === 0 ? body._id : null
}

/**
 * Looks up comparison result document stored in elastic search engine
 * using its document id.
 */
export async function fetchComparison(elasticId: string) {
  const { body } = await esClient.get({
    id: elasticId,
    index: 'comparisons',
    type: '_doc'
  })
  return body._source
}

/**
 *
 */
export function removeComparison(elasticId: string): Promise<boolean> {
  return esClient.delete({
    id: elasticId,
    index: 'comparisons',
    type: '_doc'
  }).then((response) => {
    return response.body.result.localeCompare('deleted') === 0
  }).catch((err) => {
    logger.warn('failed to remove comparison result: %s: %s', elasticId, err)
    return false
  })
}

/**
 *
 */
export async function addResult(body: Record<string, unknown>) {
  const response = await esClient.index({
    index: 'results',
    type: '_doc',
    body: body
  })
  return response.body.result?.localeCompare('created') === 0
    ? response.body._id : null
}

/**
 *
 */
export function removeResult(elasticId: string): Promise<boolean> {
  return esClient.delete({
    id: elasticId,
    index: 'results',
    type: '_doc'
  }).then((response) => {
    return response.body.result.localeCompare('deleted') === 0
  }).catch((err) => {
    logger.warn('failed to remove message result: %s: %s', elasticId, err)
    return false
  })
}

/**
 * Checks whether Weasel Platform has an established connection with
 * Weasel elasticsearch instance.
 * Intended for use during platform health check.
 *
 * @return true if elasticsearch instance is ready and responsive
 */
export async function status(): Promise<boolean> {
  const response = await esClient.ping({}, { requestTimeout: 1000 })
  return response.body
}
