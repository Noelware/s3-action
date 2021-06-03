/**
 * `@noelware/gh-s3-action` is a GitHub Action to publish contents of a
 * GitHub repository to a S3 bucket.
 *
 * Copyright (c) 2021-present Noelware
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { S3Client, ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { Provider, Credentials } from '@aws-sdk/types';
import type { Readable } from 'stream';
import * as core from '@actions/core';

/**
 * Represents an abstraction class for `S3Client` which handles uploading
 * parts to S3.
 */
export default class S3 {
  private client: S3Client;

  constructor(
    private accessKey: string,
    private secretKey: string,
    private bucket:    string,
    private useWasabi: boolean = true,
    private region:    string = 'us-east-1'
  ) {
    this.client = this.createS3Client();
  }

  /**
   * Creates the S3 client
   */
  private createS3Client() {
    core.info('Creating S3 client...');

    // I wish I didn't have to do this, but it's what I got to do
    const defaultCredentialsProvider = (): Provider<Credentials> => () => Promise.resolve({
      secretAccessKey: this.secretKey,
      accessKeyId: this.accessKey
    });

    const endpointOverride = this.useWasabi ? 'https://s3.wasabisys.com' : '';

    core.debug(`Created S3 client${endpointOverride !== '' ? ', with Wasabi!' : '.'}`);
    return new S3Client({
      credentialDefaultProvider: defaultCredentialsProvider,
      endpoint: endpointOverride,
      region: this.region
    });
  }

  async verifyBucket() {
    core.info(`Verifying bucket ${this.bucket}...`);

    const result = await this.client.send(new ListBucketsCommand({}));
    if (result.Buckets === undefined)
      throw new TypeError('Malformed data from S3 didn\'t provide buckets (or you didn\'t create any)');

    const hasBucket = result.Buckets.find(bucket => bucket.Name !== undefined && bucket.Name === this.bucket);
    if (!hasBucket)
      throw new TypeError(`Bucket "${this.bucket}" was not found. Did you provide the right region?`);
  }

  async upload(
    objectName: string,
    stream: Readable
  ) {
    core.info(`Uploading object "${objectName}"...`);

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Body: stream,
      Key: objectName
    }));

    core.info(`Uploaded object "${objectName}"`);
  }
}
