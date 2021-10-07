# Changelog

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
  from code_under_test import parse_profile, calculate_gpa

  @touca.Workflow
  def test_students(testcase: str):
      student = parse_profile(testcase)
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
