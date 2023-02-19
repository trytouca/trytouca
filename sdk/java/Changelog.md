# Changelog

## v1.7.1

## v1.7.0

Breaking Changes:

- Run tests in synchronous mode by default (#603)
- Change server API endpoint called when sealing results (#591)
- Remove Core API function `getTestcases()` with no alternative (#581)
- Submit API Key as a custom HTTP header (#511)

Features:

- Add support for synchronous comparison (#584)
- Test runner should print link to results on the server (#581)

Improvements:

- Core API functions `touca::saveJson` and `touca::saveBinary` should handle
  paths with no parent (#542)
- Update readme file (#553, #558)

## v1.6.0

Features:

- Test runner now supports configuration profiles (#523)
- Switched the default path to the directory used by the test runner for storing
  local results file from `./results` to `~/.touca/results`. You can customize
  this directory using the `--output-directory` option. (#523)
- Test runner now supports registering and running multiple workflows, one by
  one. (#523)
- Test runner now supports programmatically setting testcases, suite, and
  version for each workflow. (#523)
- Test runner now attempts to retrieve the test cases and the next version
  increment for each workflow when `testcases` and `version` are not specified.
  (#523)

Other Changes:

- Update readme file (#459)
- Do not locally store test results unless explicitly specified (#457)

## v1.5.2

Features:

- Add support for custom comparison rules (#420)

Other Changes:

- Update sample app files (#419)
- Remove duplicate examples (#418)
- Change default port in unit tests (#289)
- Fix broken links caused by repo consolidation (#15)

## v1.5.1

Features:

- Improve test framework standard output (#40, #41, #42)
- Allow user to disable colorized output (#43)
- Write a copy of test framework output into a file (#44)
- Allow user to disable reflection for unknown types (#46)
- Add CLI options for help and version (#47)

Improvements:

- Update API endpoint to obtain list of test cases (#39)
- Fix CheckStyle warnings (#45)

Other Changes:

- Remove next steps section from readme (#38)

## v1.5.0

Change of versioning strategy to use same major and minor version numbers across
all compatible SDKs.

## v0.3.2

Breaking Changes:

- Rename top-level data capturing functions (#33)

Improvements:

- Set API Key and URL as env vars in Readme file (#34)

## v0.3.1

Features:

- Enable overriding default serialization for custom types (#30)

Improvements:

- Remove placeholder name for objects (#31)

## v0.3.0

Features:

- Add high-level test framework (#23, #25)
- Report errors during test execution (#26)

Improvements:

- Add CI workflow to publish release package (#21)
- Update code snippets in readme files (#24)
