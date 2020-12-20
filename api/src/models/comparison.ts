/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { ComparisonModel, IComparisonDocument } from '../schemas/comparison'
import * as elastic from '../utils/elastic'
import logger from '../utils/logger'

/**
 *
 */
export async function comparisonRemove(
  jobs: IComparisonDocument[]
): Promise<void> {

  try {

    // remove comparison results from elasticsearch

    const removal = jobs.map((job) => elastic.removeComparison(job.elasticId))
    await Promise.all(removal)
    logger.silly('removed %d comparison results', jobs.length)

    // remove processed comparison jobs

    const jobIds = jobs.map((elem) => elem._id)
    await ComparisonModel.deleteMany({ _id: { $in: jobIds } })
    logger.silly('removed %d processed comparison jobs', jobs.length)

  } catch (err) {
    logger.warn('failed to remove comparison jobs: %s', err)
  }

}
