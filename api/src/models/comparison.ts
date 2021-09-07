// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { ComparisonModel, IComparisonDocument } from '@/schemas/comparison'
import logger from '@/utils/logger'
import * as minio from '@/utils/minio'

/**
 *
 */
export async function comparisonRemove(
  jobs: IComparisonDocument[]
): Promise<void> {
  try {
    // remove comparison results from object storage

    const removal = jobs.map((job) => minio.removeComparison(job.contentId))
    await Promise.all(removal)
    logger.debug('removed %d comparison results', jobs.length)

    // remove processed comparison jobs

    const jobIds = jobs.map((elem) => elem._id)
    await ComparisonModel.deleteMany({ _id: { $in: jobIds } })
    logger.debug('removed %d processed comparison jobs', jobs.length)
  } catch (err) {
    logger.warn('failed to remove comparison jobs: %s', err)
  }
}
