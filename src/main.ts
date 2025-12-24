/*
 * ☕ S3 Action: GitHub Action to upload objects to Amazon S3
 * Copyright (c) 2021-2026 Noelware, LLC. <team@noelware.org>, et al.
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

import { warning, info, debug, error, ExitCode } from '@actions/core';
import { create as createGlobPattern } from '@actions/glob';
import { createReadStream } from 'fs';
import { join, resolve } from 'path';
import { assertIsError } from '@noelware/utils';
import { upload, init } from './s3';
import { inferOptions } from './config';
import { basename } from 'node:path';
import { readdir } from 'node:fs/promises';
import { lstat } from 'node:fs/promises';

async function main() {
    const config = await inferOptions();
    await init(config);

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

            const files = await readdir(d, { recursive: true }).then((files) => files.map((s) => join(d, s)));
            for (const file of files) {
                debug(`Uploading file ${file} (from directory ${d})`);
                if (excluded.includes(file)) continue;

                await upload({
                    pathFormat: config.pathFormat,
                    partSize: config.partSize,
                    prefix: config.prefix,
                    bucket: config.bucket,
                    stream: createReadStream(file),
                    file: basename(file),
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
            partSize: config.partSize,
            prefix: config.prefix,
            bucket: config.bucket,
            stream: createReadStream(path),
            file,
            acl: config.objectAcl
        });
    }
}

main().catch((ex) => {
    try {
        assertIsError(ex);

        error(`failed to run \`noelware/s3-action\`: ${ex.name ? ex.name + ': ' : ''}${ex.message}`);
        if (ex.stack) debug(ex.stack);
    } catch {
        error(`failed to run \`noelware/s3-action\`: ${JSON.stringify(ex)}`);
    }

    process.exitCode = ExitCode.Failure;
});
