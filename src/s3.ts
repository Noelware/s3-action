/*
 * ☕ @noelware/s3-action: Simple and fast GitHub Action to upload objects to Amazon S3 easily.
 * Copyright (c) 2021-2024 Noelware, LLC. <team@noelware.org>
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

import { CreateBucketCommand, HeadBucketCommand, BucketCannedACL, ObjectCannedACL, S3Client } from '@aws-sdk/client-s3';
import { parsePathFormatSyntax } from './PathFormatSyntax';
import { Upload } from '@aws-sdk/lib-storage';
import type { InputConfig } from './config';
import * as core from '@actions/core';
import { lookup } from 'mime-types';
import { Readable } from 'stream';

interface InitProps
    extends Pick<
        InputConfig,
        'accessKeyId' | 'bucket' | 'bucketAcl' | 'endpoint' | 'enforcePathAccessStyle' | 'region' | 'secretKey'
    > {}

interface UploadProps {
    pathFormat: string;
    partSize: number;
    stream: Readable;
    prefix: string;
    bucket: string;
    file: string;
    acl: string;
}

// this is only exported for tests
export let s3Client: S3Client | undefined;

/**
 * Translates the `acl` string into a {@link BucketCannedACL `BucketCannedACL`} property.
 * @param acl ACL to translate
 * @throws {Error} if the ACL was not found.
 * @returns acl type
 */
export function fromBucketCannedAcl(acl: string): BucketCannedACL {
    const value = Object.values(BucketCannedACL).find((val) => acl === val);
    if (value !== undefined) {
        return value;
    }

    throw new Error(`unknown bucket ACL: ${acl}; expected [${Object.values(BucketCannedACL).join(', ')}]`);
}

/**
 * Translates the `acl` string into a {@link ObjectCannedACL `ObjectCannedACL`} property.
 * @param acl ACL to translate
 * @throws {Error} if the ACL was not found.
 * @returns acl type
 */
export function fromObjectCannedAcl(acl: string): ObjectCannedACL {
    const value = Object.values(ObjectCannedACL).find((val) => acl === val);
    if (value !== undefined) {
        return value;
    }

    throw new Error(`unknown object ACL: ${acl}; expected [${Object.values(ObjectCannedACL).join(', ')}]`);
}

/**
 * Initializes the given S3 client and returns a created {@link S3Client `S3Client`}, or
 * the already cached one.
 */
export async function init({
    accessKeyId,
    secretKey,
    bucket,
    endpoint,
    region,
    bucketAcl,
    enforcePathAccessStyle
}: InitProps) {
    if (s3Client !== undefined) {
        return s3Client;
    }

    core.info(`Initializing S3 client with bucket [${bucket}] that is from endpoint [${endpoint}]`);
    s3Client = new S3Client({
        credentialDefaultProvider: () => () => Promise.resolve({ secretAccessKey: secretKey, accessKeyId }),
        forcePathStyle: enforcePathAccessStyle,
        endpoint,
        region
    });

    core.info(`initialized s3 client! checking if bucket [${bucket}] exists`);
    const resp = await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
    if (resp.$metadata.httpStatusCode === 404) {
        core.info(`Bucket [${bucket}] doesn't exist`);
        await s3Client.send(new CreateBucketCommand({ Bucket: bucket, ACL: fromBucketCannedAcl(bucketAcl) }));
    } else if (resp.$metadata.httpStatusCode === 200) {
        /* do nothing */
    } else {
        throw new Error(
            `Received HTTP status code [${resp.$metadata.httpStatusCode || '(unknown?)'}]; ${resp.$metadata.requestId}`
        );
    }

    return s3Client;
}

export async function upload({ pathFormat, stream, prefix, bucket, file, acl, partSize }: UploadProps) {
    if (s3Client === undefined) {
        throw new Error('Call #init once to upload a object');
    }

    let contentType = lookup(file);
    if (contentType === false) {
        contentType = 'application/octet-stream';
    }

    const key = parsePathFormatSyntax(pathFormat || '$(prefix)/$(file)', { prefix, file });
    core.startGroup(`Uploading object [${file}: ${key}] | Content-Type: ${contentType}`);

    const upload = new Upload({
        client: s3Client,
        partSize: 1024 * 1024 * partSize,
        params: {
            Bucket: bucket,
            Body: stream,
            Key: key,
            ACL: fromObjectCannedAcl(acl)
        }
    });

    upload.on('httpUploadProgress', (progress) => {
        core.info(
            `~> ${progress.Key}: ${progress.Bucket} :: part=${progress.part}; loaded=${progress.loaded}; total=${progress.total}`
        );
    });

    await upload.done();
    core.endGroup();
}
