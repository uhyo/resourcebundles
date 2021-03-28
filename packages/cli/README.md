# `@resourcebundles/cli`

CLI to inspect and create Resource Bundles.

## Installation

```sh
npm install -g @resourcebundles/cli
```

## Usage

### Inspecting Resource Bundle Metadata

```sh
rbn read bundle.rbn
```

Shows metadata of resource bundles (URLs of resources in given bundle, size of each resource and headers of each resource). Following output formats are supported via the `--output` option:

- `human-readable` (default): human-readable outputs
- `json`: JSON that includes full metadata
- `url-only`: resource URLs only, one URL per line

### Creating a Resource Bundle

```sh
rbn create file1.txt file2.txt file3.txt > bundle.rbn
```

Outputs a Resouce Bundles that includes all given files.

By default, the `content-type` header is automatically generated for each file based on file names. Also, the `:status` pseudo-header is automatically set to `200`.

To include other headers, pass like `-H name=value -H name2=value2`. Given headers are set to all resources in the generated bundle. Unfortunately, currently there is no option to set response headers individually (expect for automatically generated `content-type`).

By default, relative paths from the current directory is used as resource URLs. To change the directory from which relative paths are calculated, use `--rootDir` option.
