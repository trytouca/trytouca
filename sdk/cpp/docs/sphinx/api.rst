.. _api:

API Reference
=============

Client Library
++++++++++++++

`touca/touca.hpp` is the main entry-point to the Touca SDK for C++.
In most cases, it is the only header-file that users should include in their
regression test tool. It provides all the functions necessary to configure
the client, declare testcases, capture test results, and submit them to the
Touca server. This section documents the API exposed by this header file.

Configuring the Library
-----------------------

.. doxygenfunction:: touca::configure(const std::unordered_map<std::string, std::string> &opts)
   :project: touca

.. doxygenfunction:: touca::configure(const std::string &path)
   :project: touca

.. doxygenfunction:: touca::is_configured
   :project: touca

.. doxygenfunction:: touca::configuration_error
   :project: touca

.. doxygenfunction:: touca::add_logger
   :project: touca

Declaring Testcases
-------------------

.. doxygenfunction:: touca::declare_testcase(const std::string &name)
   :project: touca

.. doxygenfunction:: touca::forget_testcase(const std::string &name)
   :project: touca

Capturing Test Results
----------------------

.. doxygenfunction:: touca::check
   :project: touca

.. doxygenfunction:: touca::assume
   :project: touca

.. doxygenfunction:: touca::add_array_element
   :project: touca

.. doxygenfunction:: touca::add_hit_count
   :project: touca

Capturing Metrics
-----------------

.. doxygenfunction:: touca::add_metric
   :project: touca

.. doxygenfunction:: touca::start_timer
   :project: touca

.. doxygenfunction:: touca::stop_timer
   :project: touca

.. doxygenclass:: touca::scoped_timer
   :project: touca

.. doxygendefine:: TOUCA_SCOPED_TIMER
   :project: touca

Saving Test Results
-------------------

.. doxygenfunction:: touca::save_binary
   :project: touca

.. doxygenfunction:: touca::save_json
   :project: touca

Submitting Test Results
-----------------------

.. doxygenfunction:: touca::post
   :project: touca

Extending Touca Type System
----------------------------

.. doxygenstruct:: touca::serializer
   :project: touca

Test Framework
++++++++++++++

.. doxygenfunction:: touca::run
   :project: touca

.. doxygenfunction:: touca::workflow
   :project: touca

Legacy Test Framework
+++++++++++++++++++++

`touca/runner/runner.hpp` is the main entry-point to the Touca test framework
for C++. In typical test tools, it is the main header file used in the
regression test tool. The Test Framework performs Touca client configuration,
testcase declaration, and saving and submitting the test results. As a result,
users may not need to include `touca/touca.hpp` if capturing test results
happens from within the code under test and outside the regression test tool.

Basic Types
-----------

.. doxygenstruct:: touca::FrameworkOptions
   :project: touca

Main Function
-------------

.. doxygenfunction:: touca::main
   :project: touca

Workflow Class
--------------

.. doxygenclass:: touca::Workflow
   :project: touca
   :members:

Suite Class
-----------

.. doxygenclass:: touca::Suite
   :project: touca
   :members:
