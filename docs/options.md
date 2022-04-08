# Action Inputs

## `upload-this-branch`: bool

> **Required**: false | **Default Value**: false

If the current branch should have its own directory when invoking the action itself. For an example:

- If the branch is **master**, then all uploads will be in `master/<directory name>/...`
- If the branch is **0.2.x**, then all uploads will be in `0.2.x/<directory name>/...`

## `object-format`: string

> **Required**: false | **Default Value**: None

Refers to the formatter that the action will use for object names. The available keys are:

- `$(branch)`: Refers to the branch name
- `$(file)`: Refers to the file name that is being uploaded, excluding the extension.

You can use the keys to format object names;

- **`$(branch)/file.js`** -> **master/file.js**
- **`$(file)-$(branch).js`** -> **file-master.js**

## `directories`: List[string]

> **Required**: True

Refers to the directories to upload to S3. You can use multiple files with the `;` seperator:

- `directories: ./a;./b;~/c`:
  - `<ROOT_DIR>/a`
  - `<ROOT_DIR>/b`
  - `<HOME>/c`

## `access-key`: string

> **Required**: True

The access key ID used for authentication. It is recommended to use a Repository Action secret to store that rather
than hard coding in the action step itself.

## `secret-key`: string

> **Required**: True

The secret key used for authentication. It is recommended to use a Repository Action secret to store that rather
than hard coding in the action step itself.

## `use-wasabi`: boolean

> **Required**: False | **Default Value**: False

This input sets the S3 endpoint when creating the client to Wasabi servers (`s3.wasabisys.com`) if you're using the Wasabi S3 service.

## `endpoint`: string

> **Required**: False | **Default Value**: s3.amazonaws.com

This input sets the S3 endpoint when creating the client to the value you specified. This is useful if you're using a MinIO instance, if that's your cup of tea, of course.

## `exclude`: string

> **Required**: False | **Default Value**: \[undefined\]

This input excludes any directories to be used when uploading to S3. Glob patterns are supported!

- `./owo` -> Excludes the `./owo` directory
- `./owo/**/*.js` -> Excludes any `.js` files from the `./owo` directory.

## `region`: string

> **Required**: False | **Default Value**: US East 1 (`us-east-1`)

This input sets the bucket region so no request errors are shown in the console.

## `bucket`: string

> **Required**: True

This input sets the bucket to be used to upload objects.

## `acl`: string

> **Required**: False | **Default Value**: `public-read`

This input sets the ACL binding of the file when uploading to S3.
