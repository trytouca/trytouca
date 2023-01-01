# Touca CLI

Touca CLI helps you run tests, manage your local test results and submit them to
the Touca server.

## Installing

You can install Touca CLI using [pip](https://pypi.org/project/touca):

```bash
pip install touca
```

## Supported operations

We support the following operations:

| Subcommand                                      | Description                                 |
| ----------------------------------------------- | ------------------------------------------- |
| [`touca help`](#getting-help)                   | Learn how to use different commands         |
| [`touca test`](#running-your-tests)             | Run your Touca tests                        |
| [`touca config`](#configuration-options)        | Manage your active configuration profile    |
| [`touca profile`](#configuration-profiles)      | Create and manage configuration profiles    |
| [`touca check`](#submitting-external-files)     | Submit external test output to Touca server |
| [`touca server`](#managing-local-server)        | Install and manage your Touca server        |
| [`touca results`](#managing-local-test-results) | Manage local test results                   |
| [`touca plugin`](#installing-plugins)           | Install and manage custom CLI plugins       |
| `touca run`                                     | Run tests on a dedicated test server        |
| `touca version`                                 | Check your Touca CLI version                |

You can run `touca help` to get this list. You can also use `help` with any
subcommand to learn about its supported options and arguments.

## Getting Help

<details>
<summary>`touca help`</summary>

```plaintext
usage: touca help [subcommand]

Shows this help message

positional arguments:
  subcommand  subcommand to get help about
```

</details>

Your best friend when using `touca` is `touca help`. You can list `touca help`
similar to `touca --help` to list supported subcommands and a brief description
for each. You can also use `touca help <command>` to get detailed help about
various commands and their respective subcommands.

## Running your tests

<details>
<summary>`touca test --help`</summary>

```plaintext
usage: touca test [-h] ...

Run your Touca tests

options:
  --testdir TESTDIR     path to regression tests directory
  --api-key API_KEY     Touca API Key
  --api-url API_URL     Touca API URL
  --team TEAM           Slug of team to which test results belong
  --suite SUITE         Slug of suite to which test results belong
  --revision VERSION    Version of the code under test
  --offline [OFFLINE]   Disables all communications with the Touca server
  --save-as-binary [SAVE_BINARY]
                        Save a copy of test results on local filesystem in binary format
  --save-as-json [SAVE_JSON]
                        Save a copy of test results on local filesystem in JSON format
  --output-directory OUTPUT_DIRECTORY
                        Path to a local directory to store result files
  --overwrite [OVERWRITE_RESULTS]
                        Overwrite result directory for testcase if it already exists
  --testcase TESTCASES [TESTCASES ...], --testcases TESTCASES [TESTCASES ...]
                        One or more testcases to feed to the workflow
  --filter WORKFLOW_FILTER
                        Name of the workflow to run
  --log-level {debug,info,warn}
                        Level of detail with which events are logged
  --colored-output [COLORED_OUTPUT]
                        Use color in standard output
  --config-file CONFIG_FILE
                        Path to a configuration file
```

</details>

Touca CLI makes it convenient to run your tests. Simply navigate to any
directory and run `touca test` with your preferred options to execute all the
workflows in that directory.

```plaintext
$ git clone git@github.com:trytouca/trytouca.git
$ cd trytouca/examples/python/02_python_main_api/
$ touca config set api-key=a66fe9d2-00b7-4f7c-95d9-e1b950d0c906
$ touca config set team=tutorial-509512
$ touca test
```

## Configuration options

<details>
<summary>`touca config --help`</summary>

```plaintext
usage: touca config [-h] {home,show,set,get,rm} ...

Manage your active configuration profile

    home                Print path to active configuration file
    show                Print content of active configuration file
    set                 Set a value for a configuration option
    get                 Get value of a configuration option
    rm                  Remove a configuration option
```

</details>

Many Touca commands take one or more configuration options. Passing these
options every time you use `touca` would not be great. Specifically,
configuration options like API Key and API URl barely change from one run to the
next. For better user experience, you can use `touca config` to set these
options in a configuration file that is automatically read by other subcommands.

```plaintext
$ touca config set api-key=a66fe9d2-00b7-4f7c-95d9-e1b950d0c906
$ touca config set api-url=https://api.touca.io/@/tutorial-509512
```

You can use `touca config home` to see where these configuration options are
kept.

```plaintext
$ touca config home
~/.touca
```

You can use `touca config show` to view the content of your activate
configuration file:

```plaintext
$ touca config show

      Option    Value
 ─────────────────────────────────────────────────────
  1   api-key   a66fe9d2-00b7-4f7c-95d9-e1b950d0c906
  2   api-url   https://api.touca.io/@/tutorial-509512

```

You can also check the value of any given option:

```plaintext
$ touca config get
https://api.touca.io/@/tutorial-509512
```

Touca uses `https://api.touca.io` for `api-url` if it is not specified so we can
use `touca config rm` to remove this option from the configuration file:

```plaintext
$ touca config rm api-url
$ touca config set team=tutorial-509512
```

## Configuration profiles

<details>
<summary>`touca profile --help`</summary>

```plaintext
usage: touca profile [-h] {ls,set,rm,cp} ...

Create and manage configuration profiles

    ls            List available profiles
    set           Change active profile
    rm            Delete profile with specified name
    cp            Copy content of a profile to a new or existing profile
```

</details>

By default, `touca config set` stores your configuration options into
`~/.touca/profiles/default`. This is enough for most use cases but if you use
the same machine for submitting test results for work and for personal projects,
you may want to have separate configuration profiles with different values for
`api-url` and other parameters. `touca profile` lets you create and switch
between your profiles.

You can use `touca profile set` to create a new profile or switch to an existing
profile:

```plaintext
$ touca profile set personal
```

You can use `touca profile cp` to create a new profile with all the
configuration options of your active profile:

```plaintext
$ touca profile cp personal work
```

You can use `touca profile ls` to list your profiles:

```plaintext
$ touca profile ls

      Name
 ──────────────────────────
  1   default
  2   development (active)
  3   staging

```

And if you no longer need a profile, you can use `touca profile rm` to remove
it:

```plaintext
$ touca profile rm personal
```

## Submitting external files

:::note New

Added in v1.8.0

:::

<details>
<summary>`touca check --help`</summary>

```plaintext
usage: touca check --suite SUITE [--testcase TESTCASE] src

Submit external test output to Touca server

positional arguments:
  src                  path to file or directory to submit

options:
  --suite SUITE        name of the suite to associate with this output
  --testcase TESTCASE  name of the testcase to associate with this output
```

</details>

You can use `touca check` to submit any external file(s) that may have been
generated as part of the test run.

```plaintext
$ touca config set api-key=a66fe9d2-00b7-4f7c-95d9-e1b950d0c906
$ touca config set team=tutorial-509512
$ touca check ./output.file --suite=my-suite
```

Since we did not specify the testcase, `touca check` will infer it from
`./output.file` as `output-file`.

You can also submit an entire directory, in which case, every file would be
treated as a separate testcase. You can pass `--testcase` to submit them all as
part of one testcase.

```plaintext
$ touca check ./output/ --suite=my-suite
```

Another use-case of `touca check` is submitting the standard output of any given
process to treat as a test result.

```plaintext
$ echo "hello" | touca check --suite=my-suite --testcase=my-testcase
```

Note that in the above case, setting `--testcase` was mandatory since there is
no filename to infer it from.

## Managing local server

:::note New

Added in v1.8.2

:::

<details>
<summary>`touca server --help`</summary>

```plaintext
usage: touca server [-h] {install,logs,status,upgrade,uninstall} ...

Install and manage your Touca server

positional arguments:
  {install,logs,status,upgrade,uninstall}
    install             Install and run a local instance of Touca server
    logs                Show touca server logs
    status              Show the status of a locally running instance of Touca server
    upgrade             Upgrade your local instance of Touca server to the latest version
    uninstall           Uninstall and remove your local instance of Touca server
```

</details>

You can use `touca server install` to set up a local instance of Touca server
using `docker-compose`. This subcommand interactively asks for the server
installation path. You can set this path using `--install-dir` option to disable
runtime interaction. We recommend installing Touca into `~/.touca/server`.

You can use `touca server status` to check the status of your local Touca server
instance. By default, this subcommand assumes that the server is running on
port 8080. You can use `--port` to change this behavior.

You can use `touca server logs` to show the last 1000 logs of the main Touca
container.

You can use `touca server upgrade` to upgrade a your local Touca server to the
latest version. Similarly, you can use `touca server uninstall` to uninstall it.
Both subcommands may prompt you for the server installation path if it is
different than `~/.touca/server`.

## Managing local test results

<details>
<summary>`touca results --help`</summary>

```plaintext
usage: touca results [-h] {list,merge,post,compress,extract,remove,edit} ...

Manage local test results

positional arguments:
    ls                  list local touca archive files
    merge               merge local touca archive files
    post                submit binary archives to a Touca server
    compress            Compress touca archive files
    extract             extract compressed binary archives
    remove              remove local touca archive files
    edit                Edit metadata of touca archive files
```

</details>

### Listing archives

<details>
<summary>`touca help results ls`</summary>

```plaintext
usage: touca results ls [--src-dir SRC_DIR] [--filter FILTER]

list local touca archive files

options:
  --src-dir SRC_DIR  Path to test results directory. Defaults to ~/.touca/results.
  --filter FILTER    Limit results to a given suite or version. Value should be in form of suite[/version].
```

</details>

You can use `touca results ls` to list all local archives in the default Touca
results directory `~/.tocua/results`. You can use `--src-dir` to change the
results directory and `--filter=example[/v1.0]` to limit the results to a given
suite or version.

```plaintext
$ touca results ls
🗃
└── students
    ├── v5.1
    │   └── 3 binary files
    ├── v5.2
    │   └── 3 binary files
    └── v5.3
        └── 3 binary files
```

### Merging archives

<details>
<summary>`touca help results merge`</summary>

```plaintext
usage: touca results merge [src_dir] [out_dir]

Merge local touca archive files

positional arguments:
  src_dir  Directory with with binary files. Defaults to ~/.touca/results.
  out_dir  Directory with merged files. Defaults to ~/.touca/merged.
```

</details>

Touca test framework generate separate binary archives for each test case as
they are executed. You can use `touca results merge` to merge binary files of
the same suite into one or more archive files of up to 10MB in size.

```plaintext
students ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
```

By default, the test results found in `~/.touca/results` will be merged into
`~/.touca/merged`. You can pass arguments `src_dir` to change this directory.
You can also pass an extra argument `out_dir` to change the directory where the
merged archives are generated.

### Posting archives

<details>
<summary>`touca help results post`</summary>

```plaintext
usage: touca results post [--api-key API_KEY] [--api-url API_URL] [--dry-run] [src_dir]

submit binary archives to a Touca server

positional arguments:
  src_dir            Directory with binary files. defaults to ~/.touca/results

Credentials:
  Server API Key and URL. Not required when specified in the active configuration profile. Ignored when "--dry-run" is specified.

  --api-key API_KEY  Touca API Key
  --api-url API_URL  Touca API URL

Other:
  --dry-run          Check what your command would do when run without this option
```

</details>

You can use `touca results post` to scan a given directory for local test
results and submit them one-by-one, sorted by their `version` value, to the
Touca server.

```plaintext
$ touca config set api-key=a66fe9d2-00b7-4f7c-95d9-e1b950d0c906
$ touca config set team=tutorial-509512
$ touca post

students/v5.1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
students/v5.2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
students/v5.3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
```

By default, the test results found in `~/.touca/results` are posted. You can
pass arguments `src_dir` to change this directory.

This operation is useful when back-filling a new instance of Touca server with
binary test results from previous versions of your workflows.

### Compressing archives

<details>
<summary>`touca help results compress`</summary>

```plaintext
usage: touca results compress [src_dir] [out_dir]

Compress touca archive files

positional arguments:
  src_dir  Path to test results directory. Defaults to ~/.touca/results.
  out_dir  Directory to store compressed files. Defaults to ~/.touca/zip
```

</details>

Touca archive files are stored in binary format. You can still compress them for
optimum long-term storage.

```plaintext
touca compress

students/v5.1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
students/v5.2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
students/v5.3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
```

By default, the test results found in `~/.touca/results` are compressed into
separate files for each version into `~/.touca/zip`. You can pass arguments
`src_dir` to change this directory. You can also pass an extra argument
`out_dir` to change where the compressed files are generated.

### Extracting archives

<details>
<summary>`touca help results extract`</summary>

```plaintext
usage: touca results extract [src_dir] [out_dir]

Extract compressed binary archives

positional arguments:
  src_dir  Directory with compressed files. Defaults to ~/.touca/zip.
  out_dir  Directory to extract binary files into. Defaults to ~/.touca/results
```

</details>

You can extract compressed archives via `touca results extract`:

```plaintext
touca extract

students ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
```

By default, the test results found in `~/.touca/zip` are extracted into into
`~/.touca/results`. You can pass arguments `src_dir` to change this directory.
You can also pass an extra argument `out_dir` to change where the extracted
files are generated.

### Removing archives

<details>
<summary>`touca help results rm`</summary>

```plaintext
usage: touca results rm [--src-dir SRC_DIR] [--filter FILTER] [--dry-run]

Remove local touca archive files

options:
  --src-dir SRC_DIR  Path to test results directory. Defaults to ~/.touca/results.
  --filter FILTER    Limit results to a given suite or version. Value should be in form of suite[/version].
  --dry-run          Check what your command would do when run without this option
```

</details>

You can also use `touca results rm` to remove local archives from the default
Touca results directory. In addition to `--src-dir` and `--filter`,
`touca results rm` supports `--dry-run` to help you double check which binary
archives will be removed, without removing them.

```plaintext
$ touca results rm

students_test/6.1 ━━━━━━━━━━━━━━━━ 100% 0:00:00
students_test/6.0 ━━━━━━━━━━━━━━━━ 100% 0:00:00
```

### Editing archives

<details>
<summary>`touca help results edit`</summary>

```plaintext
usage: touca results edit [--filter FILTER] [--team TEAM] [--suite SUITE] [--version VERSION] [src_dir] [out_dir]

Edit metadata of touca archive files

positional arguments:
  src_dir            Directory with with binary files. Defaults to ~/.touca/results.
  out_dir            Directory with modified files. Defaults to ~/.touca/modified.

options:
  --filter FILTER    Limit results to a given suite or version. Value should be in form of suite[/version].
  --team TEAM        new value for the team slug
  --suite SUITE      new value for the suite slug
  --version VERSION  new value for the version slug
```

</details>

By design, Touca archive files include the metadata for each test case including
`team`, `suite` and `version`. You can use `touca results edit` to modify these
metadata fields in binary archives before submitting them to the Touca server.

```plaintext
$ touca results edit --filter students --suite students_2

students/v5.1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
students/v5.2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
students/v5.3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00
```

## Installing plugins

<details>
<summary>`touca plugin --help`</summary>

```plaintext
usage: touca plugin [-h] {new,add,list,rm} ...

Install and manage custom CLI plugins

positional arguments:
    new            Create a new plugin
    add            Install a plugin
    ls             List available plugins
    rm             Uninstall a plugin
```

</details>

Touca CLI is extensible. You can write your custom plugin and then install them
as a subcommand for `touca`:

```plaintext
$ touca plugin new example
```

The above command creates an `example.py` with the following placeholder
content:

```python
from touca.cli.common import CliCommand

class ExampleToucaCliPlugin(CliCommand):
    name = "example"
    help = "Brief description of this plugin"

    def run(self):
        print(f"Hello world!")
```

You can edit this to implement your custom logic, then use `touca plugin add` to
install it as a user-defined plugin.

```plaintext
$ touca plugin add example.py
```

The above command copies the `example.py` module to the `~/.touca/plugins`
directory. You can use `touca plugin ls` to verify this by listing all the
installed user plugins:

```plaintext
$ touca plugin ls

      Name      Description
 ────────────────────────────────────────────────
  1   example   Brief description of this plugin

```

If you no longer need a plugin, you can use `touca plugin rm` to remove it from
the plugins directory:

```plaintext
$ touca plugin rm example
```
