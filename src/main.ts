/*
 * ☕ @noelware/s3-action: Simple and fast GitHub Action to upload objects to Amazon S3 easily.
 * Copyright (c) 2021-2023 Noelware, LLC. <team@noelware.org>
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

import { create as createGlobPattern } from '@actions/glob';
import { info, setFailed, warning } from '@actions/core';
import { initS3Client, upload } from './s3';
import { createReadStream } from 'fs';
import { inferOptions } from './config';
import { readdir } from '@noelware/utils';
import { resolve } from 'path';
import { lstat } from 'fs/promises';

async function main() {
    const config = await inferOptions();
    await initS3Client(config);

    const excludedPatterns = await createGlobPattern(config.exclude.join('\n'), {
        followSymbolicLinks: config.followSymlinks
    });

    const excluded: string[] = [];

    info(`Excluding ${config.exclude.length} files/directories...`);
    for await (const file of excludedPatterns.globGenerator()) excluded.push(file);

    for (const dir of config.directories) {
        info(`--> Uploading directory ${dir} (excluded: ${excluded.includes(dir)})`);
        if (excluded.includes(dir)) continue;

        const globber = await createGlobPattern(dir, { followSymbolicLinks: config.followSymlinks });
        for await (const d of globber.globGenerator()) {
            const stats = await lstat(d);
            if (!stats.isDirectory()) {
                warning(`Path ${d} is not a directory, skipping!`);
                continue;
            }

            const files = await readdir(d);
            for (const file of files) {
                const filename = file.replace(d, '');
                if (excluded.includes(filename)) continue;

                await upload({
                    pathFormat: config.pathFormat,
                    prefix: config.prefix,
                    bucket: config.bucket,
                    stream: createReadStream(file),
                    file: filename,
                    acl: config.objectAcl
                });
            }
        }
    }

    for (const file of config.files) {
        const path = resolve(process.cwd(), file);

        info(`--> Uploading file ${file} (excluded: ${excluded.includes(path)})`);
        if (excluded.includes(path)) continue;

        await upload({
            pathFormat: config.pathFormat,
            prefix: config.prefix,
            bucket: config.bucket,
            stream: createReadStream(path),
            file,
            acl: config.objectAcl
        });
    }
}

main().catch((ex) => setFailed(ex));
