# ☕ Upload to Amazon S3 | GitHub Action

> _Simple and fast GitHub Action to upload objects to Amazon S3 easily._
>
> <kbd><a href="https://github.com/Noelware/s3-action/releases/v2.2.0">v2.2.0</a></kbd> | [:scroll: **Documentation**](https://s3.noelware.org)

**s3-action** is a simple and easy GitHub Action to upload artifacts to any compatible Amazon S3 instances. Noelware uses Amazon S3 to host our artifacts, images and more with [:feather: Hazel](https://noelware.org/hazel).

## Usage

```yaml
steps:
    - name: Upload to Amazon S3
      uses: Noelware/s3-action@2 # this can be `master` or a tagged release
      with:
          directories: |
              ./some/directory,
              ./some/other/directory

          access-key-id: { access key id here }
          path-format: '/$(tag)'
          secret-key: { some secret key here }
          endpoint: s3.amazonaws.com
          prefix: /artifacts
          region: us-east-1
          bucket: { some bucket name here }
```

## Inputs

### directories: `List[String]` (Required: No, Default: `[]`)

The **directories** input indicates which directories should be uploaded to Amazon S3. The action will recursively get all the files in said directories and upload them via the [Bulk Upload Endpoint](#), if objects are more than ~75MB, the object will use the [Multipart Upload Endpoint](#).

### files: `List[String]` (Required: No, Default: `[]`)

The **files** inputs indicicates which files should be uploaded to Amazon S3. You can use the pattern glob syntax to check for specific files with the `.js` extension and more. If objects are more than ~75MB, the object will use the [Multipart Upload Endpoint](#).

### access-key-id: `String` (Required: Yes)

**access-key-id** is the access key ID to use when authenticating with Amazon S3. This value shouldn't be hardcoded in your action and represented a secret, for example:

```yaml
access-key-id: ${{ secrets.S3_ACCESS_KEY_ID }}
```

### path-format: `String` (Required: No, Default: `null`)

**path-format** is a special field, it handles how the path should be formatted when uploading to Amazon S3. The library provides with multiple "keys" encapsulated in `$()` to use.

-   `$(file)`: The file name that is being uploaded, returns as the relative path.
-   `$(prefix)`: The prefix that is configured to use, i.e, `/artifacts`.
-   `$(branch)`: Returns the current branch the action is being ran in, examples: `master`, `main`, `trunk`, etc.
-   `$(tag)`: Returns the current release tag if it can be found, it will not attempt to put the actual release tag if the action isn't running with the `release` event.
-   `$(os)`: Returns the operating system name.
-   `$(arch)`: Returns the host CPU architecture name.

#### Examples

-   `$(prefix)/$(branch)/$(file)` -> /artifacts/trunk/charted/server/v0.1.tar.gz
-   `$(branch)/$(file)` -> /trunk/charted/server/v0.1.tar.gz
-   `$(prefix)/$(file)` (default) -> /artifacts/charted/server/v0.1.tar.gz

### endpoint: `URL` (Required: No, Default: `https://s3.amazonaws.com`)

The endpoint URL to reach when connecting to Amazon S3. By default, it will use the official S3 server (`https://s3.amazonaws.com`).

#### Recepies

##### Wasabi

```yaml
endpoint: https://s3.wasabisys.com
```

##### MinIO

```yaml
endpoint: https://<host where your MinIO server is>
enforce-path-access-style: true
```

### prefix: `String` (Required: No, Default: `/`)

The prefix to use when uploading artifacts. This can be useful when using the [path format syntax](#path-format-string-required-no). This must start with a `/` or a validation error will pop up when running the action.

### region: `String` (Required: No, Default: `us-east-1`)

The region to hit when connecting to Amazon S3. By default, it will connect to the **US East 1** servers.

### bucket: `String` (Required: Yes)

The bucket to put the artifacts in.

### bucket-acl: `String` (Required: No, Default: `public-read`)

The access control level for the [bucket](#bucket-string-required-yes) when the bucket doesn't exist, since the action will attempt to create it.

### object-acl: `String` (Required: No, Default: `public-read`)

The access control level for objects when uploading it to Amazon S3.

### exclude: `List[String]` (Required: No, Default: `[]`)

The list of excluded files or directories to exclude

### enforce-path-access-style: `Boolean` (Required: No, Default: `false`)

If the path access style should be enforced or not. Recommended for Minio instances.

## License

**s3-action** is released under the **MIT License** with love, by [Noelware](https://noelware.org) :3
