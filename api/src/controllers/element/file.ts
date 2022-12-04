// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import { fileTypeFromBuffer } from 'file-type'

import { Artifact } from '@/types/backendtypes'
import { objectStore } from '@/utils/store'

/**
 * @summary
 * Compares two messages submitted for the same element in two batches.
 *
 * @description
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamMember`
 *  - `hasSuite` to yield `suite`
 *  - `hasElement` to yield `element`
 *  - `hasBatch` to yield `batch`
 *  - `hasArtifact` to yield `artifact`
 */
export async function elementFile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const artifact = res.locals.artifact as Artifact
  artifact.content = await objectStore.getArtifact(
    artifact.message_id,
    artifact.filename_internal
  )
  if (!artifact.content) {
    return next({
      errors: ['unexpected response from cloud service'],
      status: 500
    })
  }
  const contentType = await fileTypeFromBuffer(artifact.content)

  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${artifact.filename_external}`
  )
  res.setHeader('Content-Type', contentType.mime)
  res.writeHead(200)
  res.end(artifact.content)
}
