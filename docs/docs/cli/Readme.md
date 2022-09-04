# Touca CLI

Touca CLI helps you run tests, submit your test results to the Touca server, and
manage your local binary archives.

## Installing

You can install Touca CLI using [pip](https://pypi.org/project/touca):

```bash
pip install touca
```

## Supported operations

We support the following operations:

| Subcommand                                 | Description                              |
| ------------------------------------------ | ---------------------------------------- |
| [`touca help`](#getting-help)              | Get help on different subcommands        |
| [`touca test`](#running-your-tests)        | Run your Touca tests                     |
| [`touca config`](#configuration-options)   | Manage your active configuration profile |
| [`touca profile`](#configuration-profiles) | Create and manage configuration profiles |
| [`touca merge`](#merging-archives)         | Merge binary archives                    |
| [`touca post`](#posting-archives)          | Submit binary archives to a Touca server |
| [`touca zip`](#compressing-archives)       | Compress binary archives                 |
| [`touca unzip`](#extracting-archives)      | Extract compressed binary archives       |
| [`touca update`](#updating-archives)       | Update metadata of binary archives       |
| [`touca plugin`](#installing-plugins)      | Install and manage custom CLI plugins    |
| `touca run`                                | Run tests on a dedicated test server     |
| `touca server`                             | Install and manage your Touca Server     |
| `touca version`                            | Check your Touca CLI version             |

You can run `touca --help` to get this list. You can also use `--help` with any
subcommand to learn about its supported options and arguments.

## Common operations

### Getting Help

<details>
<summary>`touca help --help`</summary>

```plaintext
usage: touca help [-h] [subcommand]

Shows this help message

positional arguments:
  subcommand  subcommand to get help about
```

</details>

Your best friend when using `touca` is `touca help`. You can list `touca help`
similar to `touca --help` to list supported subcommands and a brief description
for each. You can also use `touca help <subcommand>` to get detailed help about
a specific subcommand.

### Configuration options

<details>
<summary>`touca config --help`</summary>

```plaintext
usage: touca config [-h] {home,show,set,get,rm} ...

    home                Print path to active configuration file
    show                Print content of active configuration file
    set                 Set a value for a configuration option
    get                 Get value of a configuration option
    rm                  Remove a configuration option
```

</details>

Many Touca subcommands take one or more configuration options. Passing these
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
/Users/pejman/.touca
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

The CLI uses `https://api.touca.io` as `api-url` by default so we can remove
this option from the configuration file:

```plaintext
$ touca config rm api-url
$ touca config set team=tutorial-509512
```

### Running your tests

<details>
<summary>`touca test --help`</summary>

```plaintext
usage: touca test [-h] ...

options:
  --testdir TESTDIR     path to regression tests directory
  --api-key API-KEY     your API Key
  --api-url API-URL     your API URL
  --revision VERSION    Version of the code under test
  --suite SUITE         Slug of suite to which test results belong
  --team TEAM           Slug of team to which test results belong
  --workflow WORKFLOW   Name of the workflow to run
  --testcase TESTCASES [TESTCASES ...], --testcases TESTCASES [TESTCASES ...]
                        One or more testcases to feed to the workflow
  --testcase-file TESTCASE-FILE
                        Single file listing testcases to feed to the workflows
  --config-file FILE    Path to a configuration file
  --output-directory OUTPUT-DIRECTORY
                        Path to a local directory to store result files
  --log-level {debug,info,warn}
                        Level of detail with which events are logged
  --save-as-binary [SAVE-AS-BINARY]
                        Save a copy of test results on local filesystem in binary
                        format
  --save-as-json [SAVE-AS-JSON]
                        Save a copy of test results on local filesystem in JSON
                        format
  --offline [OFFLINE]   Disables all communications with the Touca server
  --overwrite [OVERWRITE]
                        Overwrite result directory for testcase if it already exists
  --colored-output [COLORED-OUTPUT]
                        Use color in standard output
```

</details>

Touca CLI provides the simplest developer-friendly way of running your tests.
Simply navigate to any directory and run `touca test` with your preferred
options to execute all the workflows in that directory. The minimum information
required for a successful execution of your tests includes:

- Version of your code under test
- List of test cases for your test workflow
- Your Touca server credentials

```plaintext
$ git clone git@github.com:trytouca/trytouca.git
$ cd trytouca/sdk/python/examples/02_python_main_api/
$ touca config set api-key=a66fe9d2-00b7-4f7c-95d9-e1b950d0c906
$ touca config set api-url=https://api.touca.io/@/tutorial-509512
$ touca test --revision 1.0 --testcase alice bob charlie
```

### Configuration profiles

<details>
<summary>`touca profile --help`</summary>

```plaintext
usage: touca profile [-h] {ls,set,rm,cp} ...

    ls            List available profiles
    set           Change active profile
    rm            Delete profile with specified name
    cp            Copy content of a profile to a new or existing profile
```

</details>

By default, `touca config set` stores your configuration options into
`~/.touca/profiles/default`. This is enough for most use cases but if you use
the same machine for submitting test results for work and for personal projects,
you may want to have two configuration profiles with different values for
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

And if you no longer need a profile, you can simply remove it:

```plaintext
$ touca profile rm personal
```

## Managing archives

### Posting archives

<details>
<summary>`touca post --help`</summary>

```plaintext
usage: touca post [-h] [--api-key API-KEY] [--api-url API-URL] [--dry-run] [src]

positional arguments:
  src                Path to directory with binary files. Defaults to ~/.touca/results.

options:
  --api-key API-KEY  Your API Key
  --api-url API-URL  Your API URL
  --dry-run          Check what your command would do when run without this option
```

</details>

You can use `touca post` to scan the given directory for valid binary test
results and submit them one-by-one, in the ascending order of their `version`
value, to the Touca server.

```plaintext
$ touca config set api-key=a66fe9d2-00b7-4f7c-95d9-e1b950d0c906
$ touca config set api-url=https://api.touca.io/@/tutorial-509512
$ touca post ./touca/results/acme/suite
```

This operation is useful when back-filling a new instance of Touca server with
binary test results from previous versions of your workflows.

### Merging archives

<details>
<summary>`touca merge --help`</summary>

```plaintext
usage: touca merge [-h] --src SRC --out OUT --cli CLI

options:
  --src SRC   path to directory with original Touca archives directories
  --out OUT   path to directory where the merged archives should be created
  --cli CLI   path to "touca_cli" C++ executable
```

</details>

Touca test framework can generate binary archives of your test results as test
cases are executed. For convenience, you can use the `merge` operation to merge
these binary files into one or more archive files of up to 10MB in size.

```plaintext
$ touca merge --src=./unzipped/acme/suite --out=./merged/acme/suite --cli=./path/to/touca_cli
```

Where `--cli` points to the low-level [utility tool](/docs/sdk/cpp/cli) that is
shipped with our C++ SDK.

### Compressing archives

<details>
<summary>`touca zip --help`</summary>

```plaintext
usage: touca zip [-h] [src] [out]

positional arguments:
  src  Directory with binary files. Defaults to ~/.touca/results
  out  Directory to store compressed files. Defaults to ~/.touca/zip
```

</details>

Touca archive files are stored in binary format. You can still compress them for
optimum long-term storage.

```plaintext
touca zip ./raw/acme/suite ./zipped/acme/suite
```

### Extracting archives

<details>
<summary>`touca unzip --help`</summary>

```plaintext
usage: touca unzip [-h] src out

positional arguments:
  src         directory with compressed files
  out         directory to extract binary files into
```

</details>

You can extract compressed archive files via `touca unzip`:

```plaintext
touca unzip ./zipped/acme/suite ./unzipped/acme/suite
```

### Updating archives

<details>
<summary>`touca update --help`</summary>

```plaintext
usage: touca update [-h] --src SRC --out OUT --cli CLI [--team TEAM] [--suite SUITE]

options:
  --src SRC      path to directory with original Touca binary archives
  --out OUT      path to directory with updated Touca binary archives
  --cli CLI      path to "touca_cli" C++ executable
  --team TEAM    new value for the team slug
  --suite SUITE  new value for the suite slug
```

</details>

By design, Touca archive files include the metadata for each test case including
`team`, `suite` and `revision`. You can use `touca update` to modify these
metadata fields in binary archives before submitting them to the Touca server.

```plaintext
touca update --src ./merged/acme/unknown --out ./updated/acme/unknown --cli ./path/to/touca_cli --team acme-2 --suite suite-2 --revision 2.0
```

Where `--cli` points to the low-level [utility tool](/docs/sdk/cpp/cli) that is
shipped with our C++ SDK.

## Extending the CLI

### Installing plugins

<details>
<summary>`touca plugin --help`</summary>

```plaintext
usage: touca plugin [-h] {list,add,remove,template} ...

positional arguments:
    ls                  List available plugins
    add                 Install a plugin
    rm                  Uninstall a plugin
    new                 Create a new plugin
```

</details>

Touca CLI is extensible. You can write your custom plugin and then install them
as a subcommand for `touca`:

```plaintext
$ touca plugin new example
```

The above command creates an `example.py` with the following content:

```python
from argparse import ArgumentParser
from touca.cli._common import Operation

class Example(Operation):
    name = "example"
    help = "Example"

    @classmethod
    def parser(self, parser: ArgumentParser):
        parser.add_argument("args", nargs="+", help="any problem")

    def run(self):
        print("Example!")
        return True
```

Once you implement the above functions to your liking, you use
`touca plugin add` to install it as a user-defined plugin.

```plaintext
$ touca plugin add example.py
```

The above command copies the `example.py` module to the `~/.touca/plugins`
directory. You can use `touca plugin ls` to verify this by listing all the
installed user plugins:

```plaintext
$ touca plugin ls

      Name      Description
 ───────────────────────────
  1   example   Example

```

If you no longer need a plugin, you can simply remove it from the plugins
directory:

```plaintext
$ touca plugin rm example
```
