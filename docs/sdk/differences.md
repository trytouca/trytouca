# Differences

This section lists notable user-facing differences between our SDKs for different languages.

{% tabs %}
{% tab title="C++" %}
This SDK is feature-complete.
{% endtab %}

{% tab title="Python" %}
Python test framework does not support:

* Generating log files and does not integrate with external loggers.
* Stream redirection: Any content written by the workflow to the standard output or standard error will show up in the standard output during the test execution.
{% endtab %}

{% tab title="TypeScript" %}
JavaScript test framework does not support:

* Generating log files and does not integrate with external loggers.
* Stream redirection: Any content written by the workflow to the standard output or standard error will show up in the standard output during the test execution.
{% endtab %}

{% tab title="Java" %}
Java test framework does not support:

* Generating log files and does not integrate with external loggers.
* Stream redirection: Any content written by the workflow to the standard output or standard error will show up in the standard output during the test execution.
{% endtab %}
{% endtabs %}
