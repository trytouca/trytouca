// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { ElementListResponse } from '@touca/api-schema'

import { ISuiteDocument, MessageModel } from '../schemas/index.js'

type ElementListBaselineResponse = Array<
  Pick<ElementListResponse[0], 'metricsDuration' | 'name' | 'slug'>
>

export async function elementListBaseline(
  suite: ISuiteDocument
): Promise<ElementListBaselineResponse> {
  if (suite.promotions.length === 0) {
    return []
  }
  const baseline = suite.promotions[suite.promotions.length - 1]
  const elements = await MessageModel.aggregate([
    { $match: { batchId: baseline.to } },
    { $sort: { submittedAt: 1 } },
    {
      $lookup: {
        as: 'elementDoc',
        foreignField: '_id',
        from: 'elements',
        localField: 'elementId'
      }
    },
    { $unwind: '$elementDoc' },
    {
      $project: {
        _id: 0,
        metricsDuration: '$meta.metricsDuration',
        name: '$elementDoc.name',
        slug: '$elementDoc.slug'
      }
    },
    { $sort: { metricsDuration: 1 } }
  ])
  return elements
}
