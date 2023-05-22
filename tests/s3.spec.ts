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

import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';
import { resolve } from 'path';
import { test, expect } from 'vitest';
import * as s3 from '../src/s3';

const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;

if (accessKeyId !== undefined && secretAccessKey !== undefined) {
    test('if we can init the s3 client correctly', async () => {
        await expect(
            s3.initS3Client({
                accessKeyId,
                secretKey: secretAccessKey,
                bucket: 'august',
                bucketAcl: 'public-read',
                endpoint: process.env.S3_ENDPOINT ?? 'https://s3.amazonaws.com',
                region: process.env.S3_REGION ?? 'us-east-1',
                enforcePathAccessStyle: true
            })
        ).resolves.toBeTruthy();
    });

    test('if we can upload file', async () => {
        await expect(
            s3.upload({
                pathFormat: '$(prefix)/$(file)',
                prefix: '/',
                stream: createReadStream(resolve(__dirname, '__fixtures__/wuff.json')),
                bucket: 'august',
                file: 'wuff.json',
                acl: 'public-read'
            })
        ).resolves.toBeUndefined();

        // we need to delete it so we don't override the same thing lol
        await expect(
            s3.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: 'august',
                    Key: '/wuff.json'
                })
            )
        ).resolves.toBeTruthy();
    });
} else {
    test('simple test because no env variables were defined', () => {
        expect(1 + 1).toBe(2);
    });
}
