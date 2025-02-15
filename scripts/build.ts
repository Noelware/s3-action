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

import { basename, resolve } from 'path';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import * as colors from 'colorette';
import * as log from './util/logging';
import ncc from '@vercel/ncc';

async function main() {
    const ROOT = fileURLToPath(new URL('..', import.meta.url));
    log.info(`root directory: ${ROOT}`);

    using _ = log.group('Building @noelware/s3-action');
    const result = await ncc(resolve(ROOT, 'src/main.ts'), {
        minify: true,
        cache: false,
        license: resolve(ROOT, 'LICENSE')
    });

    const took = result.stats.compilation.endTime - result.stats.compilation.startTime;
    log.info(
        `${colors.isColorSupported ? colors.bold(colors.green('SUCCESS')) : 'SUCCESS'}   built successfully ${
            colors.isColorSupported ? colors.bold(`[${took}ms]`) : `[${took}ms]`
        }`
    );

    if (!existsSync(resolve(ROOT, 'build'))) {
        await mkdir(resolve(ROOT, 'build'));
    }

    await writeFile(resolve(ROOT, 'build/action.js'), result.code);
    for (const [file, { source }] of Object.entries(result.assets)) {
        await writeFile(resolve(ROOT, 'build', basename(file)), source);
    }
}

main().catch((ex) => {
    log.error(ex);
    process.exit(1);
});
