/*
 * ☕ @noelware/s3-action: Simple and fast GitHub Action to upload objects to Amazon S3 easily.
 * Copyright (c) 2021-2025 Noelware, LLC. <team@noelware.org>
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

import { DeleteObjectCommand, BucketCannedACL, ObjectCannedACL } from '@aws-sdk/client-s3';
import { expect, test } from 'bun:test';
import { createReadStream } from 'fs';
import * as s3 from '../src/s3';
import { resolve } from 'path';

const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;

test.if(accessKeyId !== undefined && secretAccessKey !== undefined)(
    'if we can init the s3 client correctly',
    async () => {
        expect(
            s3.init({
                accessKeyId: accessKeyId!,
                secretKey: secretAccessKey!,
                bucket: 'noelware',
                bucketAcl: 'public-read',
                endpoint: process.env.S3_ENDPOINT ?? 'https://s3.amazonaws.com',
                region: process.env.S3_REGION ?? 'us-east-1',
                enforcePathAccessStyle: true
            })
        ).resolves.toBeTruthy();
    }
);

test.if(accessKeyId !== undefined && secretAccessKey !== undefined)(
    'if we can init the s3 client correctly (with `endpoint` not having `http://` or `https://`',
    async () => {
        let url = process.env.S3_ENDPOINT ?? 'https://s3.amazonaws.com';
        if (url.startsWith('http')) {
            const idx = url.startsWith('https') ? 5 : 4;
            url = url.substring(idx + 3 /* http:// = 7, https:// = 8 */);
        }

        expect(
            s3.init({
                accessKeyId: accessKeyId!,
                secretKey: secretAccessKey!,
                bucket: 'noelware',
                bucketAcl: 'public-read',
                endpoint: url,
                region: process.env.S3_REGION ?? 'us-east-1',
                enforcePathAccessStyle: true
            })
        ).resolves.toBeTruthy();
    }
);

test.if(accessKeyId !== undefined && secretAccessKey !== undefined)('if we can upload file', async () => {
    expect(
        s3.upload({
            pathFormat: '$(prefix)/$(file)',
            partSize: 15,
            prefix: '/',
            stream: createReadStream(resolve(__dirname, '__fixtures__/wuff.json')),
            bucket: 'noelware',
            file: 'wuff.json',
            acl: 'public-read'
        })
    ).resolves.toBeUndefined();

    // we need to delete it so we don't override the same thing lol
    expect(
        s3.s3Client!.send(
            new DeleteObjectCommand({
                Bucket: 'noelware',
                Key: '/wuff.json'
            })
        )
    ).resolves.toBeTruthy();
});

test.each(Object.values(ObjectCannedACL))('fromObjectCannedAcl(%s) should not fail', (acl) => {
    expect(() => s3.fromObjectCannedAcl(acl)).not.toThrow(Error);
});

test.each(Object.values(BucketCannedACL))('fromBucketCannedAcl(%s) should not fail', (acl) => {
    expect(() => s3.fromObjectCannedAcl(acl)).not.toThrow(Error);
});
