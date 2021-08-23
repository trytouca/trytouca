---
description: Instructions for using Touca CLI Utility Application
---

# Command Line Tool

This page documents basic features and functionalities of our Touca CLI tool that is currently shipped as part of our SDK for C++.

Touca CLI is a utility application that makes dealing with Touca result files more convenient. Touca result files are generated in binary format and may contain test results captured for any number of test cases. Typical regression test tools developed with Touca SDKs do not need generating test result files since their test results are sent to the Touca Platform in real-time as tests are executed. But some organizations may choose to store test results on filesystem for reproducibility or archival.

## Building the CLI

At the moment, Touca CLI is part of our SDK for C++ and can only be obtained through building from source. The build process requires a reasonably up-to-date version of CMake and supports a broad range of modern compilers, including GCC, Clang and MSVC.

To build the CLI, first clone the repository for our SDK for C++. Then navigate to the cloned directory and simply invoke its top-level `build.sh` script as shown below.

```bash
git clone git@github.com:trytouca/touca-cpp.git
cd touca-cpp
./build.sh --with-utils
```

The build script builds the CLI from source and generates a `touca_cli` executable in the `./local/dist/bin` directory relative to the `touca-cpp` directory.

Optionally, if you like easier access to the Touca CLI from any working directory, you can install this executable on your system via the command below:

```bash
sudo cmake --install local/build
```

On most Unix systems, this command installs the executable in the `/usr/local/bin` directory.

## Supported Commands

{% hint style="info" %}
We are considering to expand Touca CLI features and functionalities in 2022. We like to learn more about your needs and use cases. Use our [feedback page](https://getweasel.com/feedback) to share your thoughts and suggest features.
{% endhint %}

Touca CLI currently supports five different operations on one or multiple result files. When running the CLI tool, you can specify which one of these operations you want to perform by passing the appropriate `mode` as an argument to `touca_cli`. Each operational mode has its own set of command line options and arguments. You can find the full list of all supported options for each mode by passing the `--help` argument as shown below:

```bash
touca_cli view --help
```

### Viewing Result Files

Touca stores all test results in binary format, to preserve the data types for each captured value. While this storage format is extremely efficient, it makes it inconvenient to lookup the captured test results without the use of the Touca Platform. To fix this problem, `touca_cli` supports `--mode=view` that prints a JSON representation of the content of a specified file, if it is indeed a valid Touca Result File. An example use-case of this command is provided below.

```bash
touca_cli view --src "path/to/some_file"
```

### Comparing Result Files

Similar to the `view` mode, while it is possible to compare test results through the Touca Platform, sometimes you may prefer a quick way to compare two generated test result files. The `compare` mode in `touca_cli` can perform this action and print the JSON representation of all differences found between any two result files.

```bash
touca_cli compare --src "path/to/some_file" --dst "path/to/another_file"
```

### Posting Result Files

In uncommon conditions, you may prefer not to submit your test results to the Touca Platform while running your tests. One example may be when running your test in an environment without network access. In these scenarios, generating Result Files can be a considered a reasonable solution that allows submission of results at a later time, using the `post` mode of `touca_cli` tool.

```bash
touca_cli post --src "path/to/some_file_or_directory" --api-key "your_api_key" --api-url "https://api.touca.io"
```

Note in the command above that we did not specify the team, suite or version for which the results are being submitted. The binary result files already contain this information.

### Updating Result File Metadata

In rare cases, you may intend to submit test results under a specific team/suite/version combination, different from the combination provided during the execution of the test. To meet this need, `touca_cli` provides an `update` mode that allows for updating the metadata of any given set of Result Files.

```bash
touca_cli update --src "path/to/original_file" --out "path/to/new_updated_file" --team "new-team-slug" --suite "new-suite-slug" --revision "new-version-slug"
```

### Merging Result Files

Finally, `touca_cli` provides a `merge` operation that allows you to merge the Test Results in a given set of Result Files together to reduce the number of your test results.

```bash
touca_cli merge --src "path/to/originl_directory" --out "path/to/new_merged_directory"
```

If the size of the Test Results stored in the set of original files is too large, `touca_cli` may decide to generate more than one "merged" file.

