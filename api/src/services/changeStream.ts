import logger from '@/utils/logger'
import mongoose from 'mongoose'

export const initChangeStream = () => {
  const client = mongoose.connection.getClient()

  const db = client.db('touca')

  const stream = db.watch()
  logger.debug('watching streams')

  stream.on('change', (doc) => {
    logger.info('change detected from stream')
  })
}
