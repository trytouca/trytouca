# Changelog

## v1.6.0

Improvements:

- Move deserialization code to CLI (#450)

## v1.5.2

Breaking Changes:

- Switch from `nlohmann/json` to `RapidJSON` (#69)

Bug Fixes:

- Fix incorrect iterator access

Improvements:

- Update flatbuffers schema implementation files (#412)
- Use the same logo everywhere (#386)
- Enable deserializing results with no team slug (#285)
- Improve layout of API reference documentation webpage (#278)
- Fix broken build on some linux distributions due to missing headers (#106)
- Remove default slug for team field when parsing result files (#25)
- Fix broken links caused by repo consolidation (#15)
- Refactor data_point, array and object classes
- Translation units should compile with `-std=c++11` by default
- Fix unnecessary pass by value in Response constructor
- Use variant to store captured values in data point

Other:

- Update sample app (#421)
- Remove duplicate examples in sdk directory (#415)
- Move the comparison logic for elements map (#393)
- Change default port in unit tests to 8080 (#289)
- Remove code related to the Comparator component (#266, #267)
- Upgrade Doxyfile (#182)
- Move cli headers to cli directory (#116)
- Update version number in docs (#110)
- Remove external_input example (#68)
- Examples should promote using return value of run function
- Simplify swap function to fix broken build for older compilers
- Move example `external_input` to `examples` directory
- Reduce clang-tidy warnings

## v1.5.1

Breaking Changes:

- Remove suites header file (#103)
- Remove legacy test framework (#110)

Bug Fixes:

- Rename framework to runner (#104)
- Remove nested framework namespace (#105)
- Remove LogLevel enum from the test framework (#107)
- Remove deprecated functions from api reference (#108)
- Move test case execution logic to separate function (#109)
- Fix handling of test cases with curly braces in name (#115)

Improvements:

- Update API endpoint to obtain list of test cases (#102)
- Improve formatting of the test framework output (#106)

Other:

- Remove next steps section from readme (#100)
- Add documentation for the runner file (#101)
- Update sample CLI output (#111)
- Reorganize code for handling configuration options (#112)
- Reuse function for parsing environment variables (#113)
- Simplify command in documentation for running main example (#114)

## v1.5.0

Breaking Changes:

- Simplify interface to add serializers for user-defined types (#77, #92, #97)
- Remove configuration options for test results submission (#94, #96, #98)
- Restructure internal headers for object serialization (#88, #89, #90, #91)
- Restructure utility header files (#86)
- Remove nested namespaces (#84, #85)
- Move deserialization logic to separate file (#80)
- Switch dependency on `RapidJSON` to `nlohmann/json` (#79)
- Rename high-level data capturing API (#76, #78)
- Rename `utils` directory to `cli` (#75)

Features:

- Add support for null values (#83)

Improvements:

- Improve handling of configuration parameters (#95)
- Remove C++ SDK dependency on `spdlog` (#93)
- Improve logic for storing captured data to files (#81)

Other:

- Rename `parse_profile` to `find_student` in example projects (#87)
- Miscellaneous coding style improvements (#82)
- Remove binary schema files (#74)
- Include README and LICENSE files in Conan package (#72)

## v1.4.2

Improvements:

- Upgrade library dependencies (#71)
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
