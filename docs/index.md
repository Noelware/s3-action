# S3 GitHub Action

**s3-action** is a GitHub action created by [Noelware](https://noelware.org) to upload directories to a S3 bucket with relative ease.

## Example

```yml
name: ...
on: ...
jobs:
  upload-s3-parts:
    runs-on: ubuntu-latest
    steps:
      - name: checkout
        uses: actions/checkout@v2

      - name: upload to s3 bucket
        uses: noelware/s3-action@v1.2.0
        with:
          directories: './directories;./to;./use'
          access-key: <aws s3 access key>
          secret-key: <aws s3 secret key>
          bucket: <bucket name>
```

You can view a list of [options here](https://s3.noelware.org/options).
