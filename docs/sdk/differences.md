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

Unlike other SDKs, the flag to operate in offline mode is named `--skip-post`
instead of `--offline`.

Some boolean flags like `--save-as-json` have an implicit value of `true` if the
value is not passed as an argument. Other flags like `--save-as-binary` expect
the value to be explicitly specified, even if they have a default value.

```bash
./local/dist/bin/example_cpp_basic_api \
  --team some-team --suite some-suite --revision 1.0 \
  --skip-post --overwrite --save-as-json \
  --save-as-binary true \
  --testcase alice
```

{% endtab %}

{% tab title="Python" %}

Touca SDK for Python expects values of boolean flags to be explicitly specified.
You can pass multiple test cases by using the `--testcase` option several times.

```bash
python examples/02_python_basic_api/students_test.py \
  --team some-team --suite some-suite --revision 1.0 \
  --offline true --overwrite true --save-as-json true \
  --save-as-binary true \
  --testcase alice --testcase bob --testcase charlie
```

If configured to submit results to the Touca server, the test framework for this
SDK automatically seals the version when all specified test cases are executed.

The test framework does not generate log files and does not integrate with
external loggers. The framework does not support stream redirection either. Any
content written by the workflow to the standard output or standard error will
show up in the standard output during the test execution.

{% endtab %}

{% tab title="JavaScript" %}

Touca SDK for JavaScript expects values of boolean flags to be explicitly
specified. You can pass multiple arguments as values for the `--testcase`
option.

```bash
node examples/02_node_basic_api/dist/students_test.js \
  --team some-team --suite some-suite --revision 1.0 \
  --offline true --overwrite true --save-as-json true \
  --save-as-binary true \
  --testcase alice bob charlie
```

If configured to submit results to the Touca server, this SDK automatically
seals the version when all specified test cases are executed.

Unless explicitly configured to do so, this SDK does not create a copy of
results on the local filesystem.

The test framework for this SDK does not generate log files and does not
integrate with external loggers. The framework does not support stream
redirection either. Any content written by the workflow to the standard output
or standard error will show up in the standard output during the test execution.

{% endtab %}

{% endtabs %}
