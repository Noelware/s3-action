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

import { mkdir, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import rimraf from 'rimraf';
import ncc from '@vercel/ncc';

async function main() {
  // Remove the `build` directory when building
  rimraf.sync(join(process.cwd(), 'build'));

  console.log('Building @noelware/s3-action with @vercel/ncc...');
  const result = await ncc(resolve(process.cwd(), 'src/main.ts'), {
    minify: true,
    cache: false,
    license: 'LICENSE'
  });

  const took = result.stats.compilation.endTime - result.stats.compilation.startTime;
  console.log(`--> Build took ~${took}ms to complete`);

  if (!existsSync(join(process.cwd(), 'build'))) await mkdir(join(process.cwd(), 'build'));
  await writeFile(join(process.cwd(), 'build', 'action.js'), result.code);

  for (const [file, { source }] of Object.entries(result.assets)) {
    await writeFile(join(process.cwd(), 'build', file), source);
  }
}

main().catch((ex) => {
  console.error(ex);
  process.exit(1);
});
