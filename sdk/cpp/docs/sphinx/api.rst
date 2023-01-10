.. _api:

API Reference
=============

Core Library
++++++++++++

`touca/touca.hpp` is the main entry-point to the Touca C++ SDK. In most cases,
it is the only header-file that users need to include in their test tool.
It provides all the functions necessary to configure capture and submit test
results to the Touca server.
This section documents the API exposed by this header file.

Configuring the Library
-----------------------

.. doxygenstruct:: touca::ClientOptions
   :project: touca
   :members:

.. doxygenfunction:: touca::configure(const std::function<void(ClientOptions&)> options = nullptr)
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

Sealing a Version
-----------------------

.. doxygenfunction:: touca::seal
   :project: touca

Extending Touca Type System
----------------------------

.. doxygenstruct:: touca::serializer
   :project: touca

Test Runner
++++++++++++++

.. doxygenstruct:: touca::RunnerOptions
   :project: touca
   :members:

.. doxygenfunction:: touca::configure_runner(const std::function<void(RunnerOptions&)> options)
   :project: touca

.. doxygenfunction:: touca::workflow
   :project: touca

.. doxygenstruct:: touca::WorkflowOptions
   :project: touca
   :members:

.. doxygenfunction:: touca::run
   :project: touca
