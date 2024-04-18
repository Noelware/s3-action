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

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as log from './util/logging';
import { ESLint } from 'eslint';
import * as colors from 'colorette';
import { resolve } from 'node:path';

export async function main() {
    const ROOT = fileURLToPath(new URL('..', import.meta.url));
    log.info(`root directory: ${ROOT}`);

    const linter = new ESLint({
        allowInlineConfig: true,
        fix: !log.ci,
        cwd: ROOT
    });

    const formatter = await linter.loadFormatter('codeframe');
    let hasFailed = false;

    using _ = log.group(`linting directory [${resolve(ROOT)}]`);

    const glob = new Bun.Glob('**/*.ts');
    for await (const file of glob.scan({ cwd: ROOT })) {
        if (file.includes('node_modules') || file.includes('build')) {
            continue;
        }

        log.info(
            `${colors.isColorSupported ? colors.bold(colors.magenta('START')) : 'START'}   ${resolve(ROOT, file)}`
        );

        const contents = await readFile(resolve(ROOT, file), 'utf-8');
        const results: ESLint.LintResult[] = await linter.lintText(contents, {
            filePath: resolve(ROOT, file)
        });

        if (!log.ci) {
            const shouldPrint = await formatter.format(results);
            shouldPrint.length > 0 && console.log(shouldPrint);
        } else {
            for (const result of results) {
                for (const msg of result.messages) {
                    switch (msg.severity) {
                        case 0:
                            continue;

                        case 1:
                            log.warn(
                                `[${msg.ruleId || '(unknown rule)'}] ${msg.message} (line ${msg.line}:${msg.column})`
                            );
                            continue;

                        case 2:
                            hasFailed = true;
                            log.error(
                                `${
                                    colors.isColorSupported ? colors.bold(colors.red('FAILED')) : 'FAILED'
                                } file [${file}] has failed to lint properly; run \`bun run lint\` outside of CI to fix it: ${
                                    msg.ruleId || '(unknown rule)'
                                }: ${msg.message}`,
                                {
                                    startColumn: msg.endColumn,
                                    endColumn: msg.endColumn,
                                    startLine: msg.line,
                                    endLine: msg.endLine,
                                    title: `[${msg.ruleId || '(unknown)'}] ${msg.message}`,
                                    file: file
                                }
                            );
                    }
                }
            }
        }

        log.info(`${colors.isColorSupported ? colors.bold(colors.magenta('END')) : 'END'}     ${resolve(ROOT, file)}`);
    }

    process.exit(hasFailed ? 1 : 0);
}

main().catch((ex) => {
    log.error(ex);
    process.exit(1);
});
