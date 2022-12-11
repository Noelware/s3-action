/*
 * ☕ @noelware/s3-action: Simple and fast GitHub Action to upload objects to Amazon S3 easily.
 * Copyright (c) 2021-2023 Noelware Team <team@noelware.org>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { CreateBucketCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { parsePathFormatSyntax } from './PathFormatSyntax';
import type { InputConfig } from './config';
import * as core from '@actions/core';
import { Readable } from 'stream';
import { lookup } from 'mime-types';

let s3Client: S3Client;

export const initS3Client = async ({
  accessKeyId,
  secretKey,
  bucket,
  endpoint,
  region,
  bucketAcl,
  enforcePathAccessStyle
}: Pick<
  InputConfig,
  'accessKeyId' | 'secretKey' | 'endpoint' | 'bucket' | 'region' | 'bucketAcl' | 'enforcePathAccessStyle'
>) => {
  if (s3Client !== undefined) return s3Client;

  core.info(`Initializing S3 client with bucket ${bucket} on endpoint ${endpoint}...`);
  s3Client = new S3Client({
    credentialDefaultProvider: () => () =>
      Promise.resolve({
        secretAccessKey: secretKey,
        accessKeyId
      }),

    forcePathStyle: enforcePathAccessStyle,
    endpoint: endpoint || 's3.amazonaws.com',
    region
  });

  core.info(`Initialized S3 client! Checking if bucket ${bucket} exists...`);
  const resp = await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
  if (resp.$metadata.httpStatusCode === 404) {
    core.info(`Bucket ${bucket} doesn't exist! Creating...`);
    await s3Client.send(new CreateBucketCommand({ Bucket: bucket, ACL: bucketAcl }));
  } else if (resp.$metadata.httpStatusCode === 200) {
    core.info(`Bucket ${bucket} does exist!`);
  }

  return s3Client;
};

export const upload = async ({
  pathFormat,
  prefix,
  stream,
  bucket,
  file,
  acl
}: {
  pathFormat: string;
  stream: Readable;
  prefix: string;
  bucket: string;
  file: string;
  acl: string;
}) => {
  if (!s3Client) throw new Error('You need to initialize the S3 client with the #initS3Client function');
  core.info(`Uploading object ${file}...`);

  const contentType = lookup(file) || 'application/octet-stream';
  const key = parsePathFormatSyntax(pathFormat || '$(prefix)/$(file)', { prefix, file });
  await s3Client.send(
    new PutObjectCommand({
      ContentType: contentType,
      Bucket: bucket,
      Body: stream,
      Key: key,
      ACL: acl
    })
  );

  core.info(`Uploaded object [${file}] with content type ${contentType}`);
};
