# Changelog

## v1.6.0

Features:

- Add support for capturing binary blobs and external files (#423)
- Add support for programmatic testcase declaration (#422)
- Add support for custom comparison rules (#417)

Breaking Changes:

- Switch to building package as pure ESM (#429).

Improvements:

- Improve test coverage (#430)
- Remove duplicate examples (#416)
- Update generated schema file (#414)
- Treat integer numbers as integers (#372)
- Switch from lerna to using npm workspaces (#349)

## v1.5.6

Features:

- Support configuration profiles (#338)

## v1.5.5

Features:

- Support automatic version increments (#336)
- Allow user to limit test to a specific workflow (#332)
- Support running multiple workflows (#332)

Breaking Changes:

- Update default output directory (#333)
- Do not generate binary files by default (#332)
- Drop support for Node v12 (#329)

Improvements:

- Update dependencies (#329)

## v1.5.4

Improvements:

- Update Readme file (#199)

## v1.5.3

Other Changes:

- Switch to using npm (#185)
- CI workflow should sync Reference API docs

## v1.5.2

Improvements:

- Update package dependencies

## v1.5.1

Features:

- Improve test framework standard output (#47)
- Allow user to disable colorized output (#49)

Improvements:

- Update API endpoint to obtain list of test cases (#46)

Other Changes:

- Remove next steps section from readme (#45)
- Update sample CLI output (#48)

## v1.5.0

Change of versioning strategy to use same major and minor version numbers across
all compatible SDKs.

Improvements:

- Remove calling arguments from help output (#43)

Other:

- Remove empty comment blocks (#42)

## v0.0.9

Breaking Changes:

- Rename data capturing functions (#40)

Improvements:

- Update function name in example apps (#39)
- Add more documentation for data capturing functions (#38)
- Enable auto-formatting of markdown files (#37)
- Make ToucaError subclass of Error (#36)

## v0.0.8

Fixes:

- Fix incorrect initial value in `add_hit_count` (#32)

Improvements:

- Reduce discrepancy in flags supported by different SDKs (#34)
- Dynamically switch HTTP transport based on protocol (#31)
- Update example projects and improve their documentation (#25, #33)

## v0.0.7

Improvements:

- Add CI workflow to publish releases to NPM (#29)

## v0.0.6

Features:

- Add new function `add_serializer` for customizing type serialization (#25)

Improvements:

- Update top-level readme file (#26)
- Update example projects and improve their documentation (#25, #27)

## v0.0.5

Fixes:

- Add missing implementation for scoped timer (#24)
- Fix incorrect JSON serialization of nested types (#22)

Improvements:

- Update example projects and improve their documentation (#20, #21, #23)

## v0.0.4

Features:

- Improve test runner support of command line arguments (#18)
- Add high-level test framework (#17)
- Extend support to Node v12 and higher (#16)

Improvements:

- Improve top-level and package-level readme files (#19)

## v0.0.3

Fixes:

- Fix bug in serializing custom objects (#14)
