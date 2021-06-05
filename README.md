# S3 Uploader for GitHub Actions
> **☕ Simple GitHub action to upload contents from a GitHub repository to a S3 bucket**

## Usage
```yml
jobs:
  upload-s3-parts:
    runs-on: ubuntu-latest
    steps:
      - name: checkout
        uses: actions/checkout@v2

      - name: install node 16
        uses: actions/setup-node@v2
        with:
          node-version: 16.x

      - name: upload to s3 bucket
        uses: noelware/s3-action@v1
        with:
          directories: './directories;./to;./use'
          access-key: <aws s3 access key>
          secret-key: <aws s3 secret key>
          bucket: <bucket name>
```

## Inputs
|Name|Type|Description|Required|Default?|
|----|----|-----------|--------|--------|
|`directories`|`String[]`|List of directories to use, glob patterns are supported, use `;` to seperate|true|None.|
|`access-key`|`String`|Your S3 access key to use to authenicate|true|None.|
|`secret-key`|`String`|Your S3 secret key to use to authenicate`|true|None.|
|`use-wasabi`|`Boolean`|Uses Wasabi internal servers instead of Amazon internal servers.|false|`false`|
|`exclude`|`String`|Excludes any directories to not be uploaded, glob patterns are supported, use `;` to seperate|false|None.|
|`region`|`String`|Sets the region of the S3 bucket that it is located in|false|`us-east-1`|
|`bucket`|`String`|The bucket to use when uploading objects|true|None.|

## License
**s3-action** is released under the **GPL-3.0** License.
