.. _api:

API Reference
=============

Client Library
++++++++++++++

`weasel/weasel.hpp` is the main entry-point to the Weasel C++ Client Library.
In most cases, it is the only header-file that users should include in their
regression test tool. It provides all the functions necessary to configure
the client, declare testcases, capture test results, and submit them to the
Weasel Platform. This section documents the API exposed by this header file.

Configuring the Library
-----------------------

.. doxygenfunction:: weasel::configure(const std::unordered_map<std::string, std::string> &opts)
   :project: weasel

.. doxygentypedef:: weasel::path
   :project: weasel

.. doxygenfunction:: weasel::configure(const weasel::path &path)
   :project: weasel

.. doxygenfunction:: weasel::add_logger
   :project: weasel

Declaring Testcases
-------------------

.. doxygenfunction:: weasel::declare_testcase(const std::string &name)
   :project: weasel

.. doxygenfunction:: weasel::declare_testcase(const std::wstring &name)
   :project: weasel

.. doxygenfunction:: weasel::forget_testcase(const std::string &name)
   :project: weasel

.. doxygenfunction:: weasel::forget_testcase(const std::wstring &name)
   :project: weasel

Capturing Test Results
----------------------

.. doxygenfunction:: weasel::add_result
   :project: weasel

.. doxygenfunction:: weasel::add_assertion
   :project: weasel

.. doxygenfunction:: weasel::add_array_element
   :project: weasel

.. doxygenfunction:: weasel::add_hit_count
   :project: weasel

Capturing Metrics
-----------------

.. doxygenfunction:: weasel::add_metric
   :project: weasel

.. doxygenfunction:: weasel::start_timer
   :project: weasel

.. doxygenfunction:: weasel::stop_timer
   :project: weasel

.. doxygenfunction:: weasel::make_timer
   :project: weasel

.. doxygendefine:: WEASEL_SCOPED_TIMER
   :project: weasel

Saving Test Results
-------------------

.. doxygenfunction:: weasel::save_binary
   :project: weasel

.. doxygenfunction:: weasel::save_json
   :project: weasel

Submitting Test Results
-----------------------

.. doxygenfunction:: weasel::post
   :project: weasel

Extending Weasel Type System
----------------------------

.. doxygenstruct:: weasel::convert::Conversion
   :project: weasel

Test Framework
++++++++++++++

`weasel/framework.hpp` is the main entry-point to the Weasel Test Framework
for C++. In typical test tools, it is the main header file used in the
regression test tool. The Test Framework performs Weasel client configuration,
testcase declaration, and saving and submitting the test results. As a result,
users may not need to include `weasel/weasel.hpp` if capturing test results
happens from within the code under test and outside the regression test tool.

Basic Types
-----------

.. doxygentypedef:: weasel::framework::Testcase
   :project: weasel

.. doxygentypedef:: weasel::framework::Errors
   :project: weasel

.. doxygentypedef:: weasel::framework::Options
   :project: weasel

Main Function
-------------

.. doxygenfunction:: weasel::framework::main
   :project: weasel

Workflow Class
--------------

.. doxygenclass:: weasel::framework::Workflow
   :project: weasel
   :members:

Suite Class
-----------

.. doxygenclass:: weasel::framework::Suite
   :project: weasel
   :members:

Available Implementations
*************************

`weasel/framework/suites.hpp` provides the following implementations of the
abstract class `Suite`.

.. doxygenclass:: weasel::framework::FileSuite
   :project: weasel

.. doxygenclass:: weasel::framework::RemoteSuite
   :project: weasel

Logging
-------

.. doxygenenum:: weasel::framework::LogLevel
   :project: weasel

.. doxygenstruct:: weasel::framework::LogSubscriber
   :project: weasel
   :members:
