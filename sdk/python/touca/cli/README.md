# Touca Python CLI

Touca Python CLI helps you manage Touca archive files. It is used by Touca
enterprise customers who choose to keep a local copy of their test results when
running Touca tests on a dedicated test server.

## Managing Archive Files

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
