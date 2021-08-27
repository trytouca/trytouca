# Common Questions

- What programming languages do you support?

  Touca Platform is language agnostic. But you'd need to integrate one of our
  SDKs with your code to capture test results and submit them to the platform.
  At the moment, we only provide SDKs for [C++](../api/cpp-sdk/),
  [Python](../api/python-sdk/), and [JavaScript](../api/js-sdk/) programming
  languages.

  We are planning to release our SDK for Java in September 2021.

- What types of softwares can benefit from Touca the most?

  We think Touca is most useful for testing mission-critical software, such as
  in medical, robotics and manufacturing industries, where the overall behavior
  of system components must be checked with inputs that are too many in number
  or too large in size that can be fed into unit tests. In these systems, the
  expected output of workflows for different inputs cannot be described as unit
  test assertions.

- What types of data can we capture as test results?

  At the moment, we do not support comparing images, audio or external output
  files.

  Touca SDKs have native support for primitive data types such as integers and
  floating point numbers, characters and string, arrays and maps. In addition,
  each SDK has out of the box support for specific data types commonly used in
  their respective programming language, e.g. our C++ SDK handles
  `std::shared_ptr` while our Python SDK supports `numpy` arrays.

  Touca type system is extensible so it can support custom user-defined types as
  long as they are described in terms of already supported types. Once the SDKs
  know how to handle a type, they can handle any derivative of that type. For
  example, if we describe a `BirthDate` class to the SDK as an object with three
  member variables of type `int`, the SDK knows how to handle a variable of type
  `Map<string, BirthDate>`.

  Refer to the "Capturing Test Results" section in our
  [Create a Test Tool](../guides/submit.md) guide to learn more about Touca Type
  System.

- How many test cases can be declared for a test suite?

  There is no fixed upper limit. Touca server can handle several thousands of
  test cases in a given Suite and several hundred thousands of keys in a test
  case. For best performance, we suggest that you keep the number of test cases
  in a Suite below one thousand. Refer to our
  [Best Practices](../advanced/best-practices.md) section for more information.
