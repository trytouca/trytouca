# Changelog

## v1.4.2

Improvements:

- Rename main library from `touca_client` to `touca` (#69)
- Merge test framework into core library (#64)
- Improve formatting of the test framework summary report (#62)
- Reduce discrepancy in flags supported by different SDKs (#60)

Other:

- Use Google style for source code formatting (#70)
- Rename ResultsMapValue to ResultEntry (#68)
- Enable auto-formatting of markdown files (#67)
- Use version macros in CMake files (#63)
- Support generating code coverage with gcc (#58, #59)

## v1.4.1

Features:

- Allow specifying version and API URL as environment variables (#50, #51)

Improvements:

- Update example projects and improve their documentation (#49, #52, #53)

## v1.4.0

Features:

- Add `get_testcases()` to get list of test cases from the Touca server (#32)
- Add option `testcase-file` to the test framework (#35)

Breaking Changes:

- Change product name to Touca (#27)
- Remove top-level function `make_timer` (#33)
- Remove wide string variants from interface (#37)

Improvements:

- Improve top-level Readme file (#40, #41, #43, #45)
- Improve API Reference documentation (#39, #42, #44, #46)
- Deprecate Assertions type in FlatBuffers schema (#36)
- Remove `inline` definition of class `scoped_timer` (#38)

Credits:

Thanks to @duncanspumpkin (Duncan) for their contributions.
