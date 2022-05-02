# Changelog

## v1.5.3

Features:

- CLI should support multiple configuration profiles (#25)

Improvements:

- CLI subcommand `post` should respect configuration profile (#27)
- CLI `--help` should describe individual subcommands
- CLI subcommands should support `--help`

Other Changes:

- Add basic unit tests for CLI (#26)
- Add new python example for image comparison

## v1.5.2

Features:

- CLI should support removing key from config file (#68)
- Add config command to CLI (#67)
- Allow CLI to find and run all workflows (#63)
- Check PyPI for new SDK versions and suggest package upgrade (#62)

Improvements:

- Parse config flags stored in file as boolean (#71)
- Use custom extend action when parsing arguments (#70)
- CLI should support setting test version as environment variable (#69)
- Use full path when importing package modules (#65)

Other Changes:

- April Fool's Day: Add universal problem solver to Python CLI (#73)
- CI workflow should sync Reference API docs (#72)
- Update CI workflow (#66)
- Update links to documentation website (#64)

## v1.5.1

Features:

- Allow running test by workflow name (#60)
- Allow user to disable colorized output (#53, #54, #59)

Improvements:

- Update API endpoint to obtain list of test cases (#55)
- Update description for CLI options (#58)

Other Changes:

- Remove next steps section from readme (#52)
- Randomize sleep duration in example app (#56)
- Update sample CLI output (#57)

## v1.5.0

Change of versioning strategy to use same major and minor version numbers across
all compatible SDKs. See our
[November product updates](https://blog.touca.io/product-updates-november-2021/)
for details.

Features:

- Merge the Wrench repository as a new CLI package (#50)

## v0.2.6

Breaking Changes:

- Rename data capturing functions (#48)

Improvements:

- Update function name in example apps (#47)
- Extend test environments to cover Python 3.10 (#46)

## v0.2.5

Fixes:

- Add support for Touca environment variables to Django plugin (#45)

## v0.2.4

Fixes:

- Include plugins in release package (#44)

## v0.2.3

Features:

- Add plugin for Django test framework (#41, #42)
- Print errors raised during test case execution (#40)

Fixes:

- Gracefully handle unknown command line arguments (#40)
- Remove previous content of testcase directory when overwriting (#35)
- Allow passing multiple test cases without repeating option (#34)

Improvements:

- Remove unnecessary code in configuration logic (#39)
- Enable auto-formatting of markdown files (#38)
- Add sample unit test to main api example (#37)
- Rename example projects to conform with documentation (#36)
- Update links to documentation website (#33)

## v0.2.2

Fixes:

- Support serializing objects with no `__dict__` (#30)
- Add default serialization for `datetime.date` (#30)
- Serializing Iterables should not yield empty array (#29)
- Update HTTP transport when client is reconfigured (#24)
- Add dependency on `dataclasses` for older Python versions (#23)

Improvements:

- Update example projects and improve their documentation (#26, #27, #28, #30)

## v0.2.1

Fixes:

- Declare `certifi` as install dependency (#21)

  This patch changes package `certifi` from a development-only dependency to a
  production dependency, fixing an error when using the Touca test framework
  which required separate installation of `certifi`.

## v0.2.0

Features:

- Add Touca Test Framework for Python (#17, #18, #19)

  We introduced a new sub-module `Workflow` that simplifies writing regression
  test workflows by providing out-of-the-box support for common features and
  functionalities that are expected of a test runner such as error handling and
  progress reporting. The following code snippet demonstrates how to use this
  new test framework:

  ```py
  import touca
  from code_under_test import find_student, calculate_gpa

  @touca.Workflow
  def test_students(testcase: str):
      student = find_student(testcase)
      touca.add_assertion("username", student.username)
      touca.add_result("fullname", student.fullname)
      touca.add_result("birth_date", student.dob)
      touca.add_result("gpa", calculate_gpa(student.courses))

  if __name__ == "__main__":
      touca.run()
  ```

  Note the absence of any code for configuring the client library, obtaining the
  list of test cases, declaring them, saving test results on the local file
  system, posting, and sealing the results. The test framework performs all
  these operations and lets us focus on the code that should be executed for
  each test case.

- Enable registering custom type serializer (#16)

  You can now customize how user-defined types are serialized by registering
  your own serializer for any given Type. Consider the following example:

  ```py
  @dataclass
  class DateOfBirth:
      year: int
      month: int
      day: int
  ```

  By default, Touca library serializes any object of this class by iterating
  over its properties and serializing them individually. If we added any object
  of this class as a test result, it would show up in the Touca Server UI as
  `{"year": 2000, "month": 1, "day": 1}`. If we want to change this behavior to
  omit a certain property or change property names, we can now register a custom
  serializer for this Type:

  ```py
  serializer = lambda x: {"y": x.year, "m": x.month, "d": x.day}
  touca.add_serializer(DateOfBirth, serializer)
  touca.add_result("dob", DateOfBirth(2000, 1, 1))
  ```

  In the code snippet above, the object would be described as
  `{"y": 2000, "m": 1, "d": 1}` and is compared accordingly. The Touca library
  automatically applies registered serializations when serializing properties of
  derivate types.

- Extend support to Python v3.6 (#15)

  Initial version of this library only supported Python v3.9. We are extending
  that support to Python v3.6 and commit to supporting this version at least
  until late 2022.
