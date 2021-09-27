# SDK Differences

For the most part, Touca SDKs are designed with feature parity in mind. This
section lists notable user-facing differences between our SDKs for different
languages. We consider all of these differences as known defects and plan to
resolve them in the coming weeks.

{% tabs %}

{% tab title="C++" %}

Touca SDK for C++ only supports a single value for option `--testcase`. For this
reason, unlike other SDKs, the test framework does not seal the version after
executing the test case.

```bash
./local/dist/bin/example_cpp_main_api \
  --team some-team --suite some-suite --revision 1.0 \
  --offline --overwrite --save-as-json --save-as-binary \
  --testcase alice
```

{% endtab %}

{% tab title="Python" %}

Touca test framework for Python does not support:

- Generating log files and does not integrate with external loggers.
- Stream redirection: Any content written by the workflow to the standard output
  or standard error will show up in the standard output during the test
  execution.
- Error handling: exceptions thrown by the workflow under test are not printed
  in the test output.

{% endtab %}

{% tab title="TypeScript" %}

Touca test framework for JavaScript does not support:

- Generating log files and does not integrate with external loggers.
- Stream redirection: Any content written by the workflow to the standard output
  or standard error will show up in the standard output during the test
  execution.
- Error handling: exceptions thrown by the workflow under test are not printed
  in the test output.

{% endtab %}

{% tab title="Java" %}

Touca test framework for Java does not support:

- Generating log files and does not integrate with external loggers.
- Stream redirection: Any content written by the workflow to the standard output
  or standard error will show up in the standard output during the test
  execution.

{% endtab %}

{% endtabs %}
