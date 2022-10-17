import logger from '@/utils/logger'
import mongoose from 'mongoose'

export const initChangeStream = () => {
  const client = mongoose.connection.getClient()

  const db = client.db('touca')

  const stream = db.watch()
  logger.debug('watching streams')

  stream.on('change', (doc) => {
    console.log(doc)
  })
}
