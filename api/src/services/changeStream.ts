import logger from '@/utils/logger'
import mongoose from 'mongoose'
import ServerEvents from './serverEvents'

let calls = 0

export const initChangeStream = () => {
  if (calls > 0) return

  calls++

  const client = mongoose.connection.getClient()

  const db = client.db('touca')

  const stream = db.watch([], { fullDocument: 'updateLookup' })

  stream.on('change', (doc) => {
    if (doc.operationType === 'insert' && doc.ns.coll === 'batches') {
      ServerEvents.broadcast(doc)
    }
  })
}
