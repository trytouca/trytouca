.. _api:

.. doxygenfile:: touca.hpp
   :project: touca
   :sections: detaileddescription

This section documents the API exposed by this header file.

Test Runner
***********

.. doxygenfile:: runner.hpp
   :project: touca
   :sections: detaileddescription

.. doxygenfunction:: touca::run
   :project: touca

Adding Test Workflows
=====================

.. doxygenfunction:: touca::workflow
   :project: touca

.. doxygenstruct:: touca::WorkflowOptions
   :project: touca
   :members:

Configuring the Test Runner
===========================

.. doxygenfunction:: touca::configure_runner(const std::function<void(RunnerOptions&)> options)
   :project: touca

.. doxygenstruct:: touca::RunnerOptions
   :project: touca
   :members:

.. doxygenfunction:: touca::add_sink
   :project: touca

Core Library
************

Touca C++ SDK provides a separate lower-level Client API that offers more
flexibility and control over how tests are executed and how their results
are handled. This API is most useful when integrating Touca with other
existing test frameworks.

Configuring the Library
=======================

.. doxygenfunction:: touca::configure(const std::function<void(ClientOptions&)> options = nullptr)
   :project: touca

.. doxygenstruct:: touca::ClientOptions
   :project: touca
   :members:

.. doxygenfunction:: touca::is_configured
   :project: touca

.. doxygenfunction:: touca::configuration_error
   :project: touca

.. doxygenfunction:: touca::add_logger
   :project: touca

Declaring Testcases
===================

.. doxygenfunction:: touca::declare_testcase(const std::string &name)
   :project: touca

.. doxygenfunction:: touca::forget_testcase(const std::string &name)
   :project: touca

Capturing Test Results
======================

.. doxygenfunction:: touca::check
   :project: touca

.. doxygenfunction:: touca::assume
   :project: touca

.. doxygenfunction:: touca::add_array_element
   :project: touca

.. doxygenfunction:: touca::add_hit_count
   :project: touca

Capturing Metrics
=================

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
===================

.. doxygenfunction:: touca::save_binary
   :project: touca

.. doxygenfunction:: touca::save_json
   :project: touca

Submitting Test Results
=======================

.. doxygenfunction:: touca::post
   :project: touca

Sealing a Version
=================

.. doxygenfunction:: touca::seal
   :project: touca

Extending Touca Type System
===========================

.. doxygenstruct:: touca::serializer
   :project: touca

