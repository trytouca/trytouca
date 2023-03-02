// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { Artifact } from '../../types/index.js'
import { objectStore } from '../../utils/index.js'

/**
 * @summary
 * Fetches a given artifact from the server
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
  artifact.content = await objectStore.getArtifact(artifact.filename_internal)
  if (!artifact.content) {
    return next({
      errors: ['unexpected response from cloud service'],
      status: 500
    })
  }

  if (artifact.mime) {
    res.setHeader('Content-Type', artifact.mime)
  }
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${artifact.filename_external}`
  )
  res.writeHead(200)
  res.end(artifact.content)
}
