// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

const { resolve } = require('path')
const { pathsToModuleNameMapper } = require('ts-jest')
const ROOT_DIR = __dirname
const TSCONFIG = resolve(ROOT_DIR, 'tsconfig.json')
const tsconfig = require(TSCONFIG)

module.exports = {
  preset: 'ts-jest',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: `${ROOT_DIR}/local/tests`,
  testEnvironment: 'node',
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
    prefix: `${ROOT_DIR}/src/`
  })
}
