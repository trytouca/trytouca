# Utility CLI

## Installing

Touca result files are generated in binary format. Each file may contain test
results captured for any number of test cases. Typical Touca test tools do not
need to generate test result files since their output is directly sent to the
Touca server in real-time as tests are executed. But some organizations may
choose to store test results on filesystem for reproducibility.

We have a low-level utility command-line application `touca_cli` that makes
managing these binary result files more convenient. This application is part of
our C++ SDK and can be built through running its `build.sh` script with option
`--with-cli`.

```bash
git clone git@github.com:trytouca/trytouca.git
cd trytouca/sdk/cpp
./build.sh --with-cli
```

The build script generates a `touca_cli` executable in the `./local/dist/bin`
directory relative to the `sdk/cpp` directory. You can install this executable
for easier access from any working directory.

```bash
sudo cmake --install local/build
```

On most Unix systems, this command installs the executable to `/usr/local/bin`.

## Supported Operations

Application `touca_cli` supports five different operations on one or multiple
result files. You can select the operational mode by passing the appropriate
`mode` as an argument to `touca_cli`. Each mode has its own set of command line
options and arguments. Use the argument `--help` to obtain the list of supported
options for each mode.

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
environment without network access. In these scenarios, we can store the test
results on the local file system and submit them at a later time, using the
`post` mode of `touca_cli`.

```bash
touca_cli post --src "path/to/some_file_or_directory" --api-key "your_api_key" --api-url "https://api.touca.io"
```

Note in the command above that we did not specify the team, suite, or version
for which the results are being submitted. The binary result files already
include this information, for each test case.

### Updating Result File Metadata

In rare cases, we may intend to submit test results under a specific
team/suite/version combination that is different from the combination provided
during the test execution. `touca_cli` provides an `update` mode to update the
metadata of any given set of result files.

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
