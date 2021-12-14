# Command Line Tools

Touca result files are generated in binary format and may contain test results
captured for any number of test cases. Typical Touca test tools do not need
generating test result files since their test results are sent to the Touca
server in real-time as tests are executed. But some organizations may choose to
store test results on filesystem for reproducibility.

Touca provides **two** low-level and high-level utility command-line
applications that make dealing with Touca result files more convenient.

## Low-Level CLI

Touca CLI is part of our SDK for C++ and can only be obtained through building
from source. To build the CLI, clone its repository to a directory of your
choice. Navigate to that directory and invoke its top-level `build.sh` script
with option `--with-cli`.

```bash
git clone git@github.com:trytouca/touca-cpp.git
cd touca-cpp
./build.sh --with-cli
```

The build script generates a `touca_cli` executable in the `./local/dist/bin`
directory relative to the `touca-cpp` directory. You can install this executable
for easier access to the CLI from any working directory.

```bash
sudo cmake --install local/build
```

On most Unix systems, this command installs the executable to `/usr/local/bin`.

Touca CLI supports five different operations on one or multiple result files.
You can select the operational mode by passing the appropriate `mode` as an
argument to `touca_cli`. Each mode has its own set of command line options and
arguments. Use the argument `--help` to obtain the list of supported options for
each mode.

```bash
touca_cli view --help
```

### Viewing Result Files

`touca_cli` supports `--mode=view` that prints a JSON representation of the
content of a given Touca result file.

```bash
touca_cli view --src "path/to/some_file"
```

### Comparing Result Files

You can use `--mode=compare` to compare the captured data between two binary
result files.

```bash
touca_cli compare --src "path/to/some_file" --dst "path/to/another_file"
```

### Posting Result Files

In uncommon conditions, we may prefer not to submit test results to the Touca
server when running our tests. One example would be when running tests in an
environment without network access. In these scenarios, we can store test
results on the local file system and submit them at a later time, using the
`post` mode of `touca_cli` tool.

```bash
touca_cli post --src "path/to/some_file_or_directory" --api-key "your_api_key" --api-url "https://api.touca.io"
```

Note in the command above that we did not specify the team, suite, or version
for which the results are being submitted. The binary result files already
include this information, for each test case.

### Updating Result File Metadata

In rare cases, we may intend to submit test results under a specific
team/suite/version combination, different from the combination provided during
the test execution. `touca_cli` provides an `update` mode to update the metadata
of any given set of result files.

```bash
touca_cli update --src "path/to/original_file" --out "path/to/new_updated_file" --team "new-team-slug" --suite "new-suite-slug" --revision "new-version-slug"
```

### Merging Result Files

Finally, `touca_cli` provides a `merge` operation that allows you to merge
multiple result files to facilitate their storage.

```bash
touca_cli merge --src "path/to/original_directory" --out "path/to/new_merged_directory"
```

If the size of the test results stored in the set of original files is too
large, `touca_cli` may decide to generate more than one "merged" file.

## High-Level CLI

Touca CLI is a high-level command-line application available as open-source on
GitHub that facilitates management of Touca archive files. It is used by Touca
enterprise customers who choose to keep a local copy of their test results when
running Touca tests on a dedicated test server.

You can install this utility application using
[pip](https://pypi.org/project/touca):

```bash
pip install touca
```

The following, is a list of operations supported by this tool.

### Compressing Archive Files

Touca archive files are stored in binary format. You can still compress them for
optimum storage.

```bash
touca zip --src=./raw/acme/suite --out=./zipped/acme/suite
```

### Extracting Archive Files

You can extract compressed archive files by running using the `unzip` operation.

```bash
touca unzip --src=./zipped/acme/suite --out=./unzipped/acme/suite
```

### Merging Archive Files

By default, Touca test framework generates one binary file for each test case as
it is executed. For convenience, you can use the `merge` operation to merge
these binary files into one or more archive files of up to 10MB in size.

```bash
touca merge --src=./unzipped/acme/suite --out=./merged/acme/suite --cli=./path/to/touca_cli --logdir=./logs
```

Where `touca_cli` is the low-level utility executable that is shipped with the
Touca SDK for C++.

### Posting Archive Files

This operation is useful when back-filling a new instance of Touca server with
binary test results from previous versions of your workflows.

```bash
touca post --src=./merged/acme/suite --api-key <your-api-key> --api-url <your-api-url>
```

This command scans the archive directory for sub-directories that contain the
test results generated for a given version of your Touca test and submits them
one-by-one to the Touca server.

> Note: `post` operation expects the `merge` operation to have been run. It
> ignores subdirectories that do not end with `-merged` suffix.

### Updating Metadata

By design, Touca archive files include the metadata for each test case including
the slugs for `team`, `suite` and `revision`. You can use the `update` operation
to modify the metadata fields to submit test results that were originally
created for one suite to a different suite.

```bash
touca update --src ./merged/acme/unknown --out ./updated/acme/unknown --cli ./path/to/touca_cli --logdir ./logs --team acme-2 --suite suite-2 --revision 2.0
```

Where `touca_cli` is the low-level utility executable that is shipped with the
Touca SDK for C++.
