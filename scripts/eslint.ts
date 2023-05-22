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

import { warning, error, startGroup, endGroup } from '@actions/core';
import { __dirname as dirname } from './util/esm';
import { relative } from 'path';
import { ESLint } from 'eslint';
import getLogger from './util/log';
import run from './util/run';

const __dirname = dirname.get();
const paths = ['src/**/*.ts', 'tests/**/*.spec.ts', 'scripts/**/*.ts'] as const;
const isCI = process.env.CI !== undefined;
const log = getLogger('eslint');

run(async () => {
    const eslint = new ESLint({
        useEslintrc: true,
        fix: !isCI
    });

    for (const glob of paths) {
        isCI && startGroup(`Linting for pattern [${glob}]`);
        {
            log.info(`Starting ESLint on pattern [${glob}]`);

            const results = await eslint.lintFiles([glob]);
            for (const result of results) {
                const path = result.filePath.includes('scripts/')
                    ? `scripts/${relative(__dirname, result.filePath).replaceAll('../', '')}`
                    : relative(__dirname, result.filePath).replaceAll('../', '');

                const hasErrors = result.errorCount > 0;
                const hasWarnings = result.warningCount > 0;
                const level = hasErrors ? log.error : hasWarnings ? log.warn : log.success;

                level(path);
                for (const message of result.messages) {
                    if (isCI) {
                        const logSeverity = message.severity === 1 ? warning : error;
                        logSeverity(`${message.message} (${message.ruleId})`, {
                            endColumn: message.endColumn,
                            endLine: message.endLine,
                            file: result.filePath,
                            startLine: message.line,
                            startColumn: message.column
                        });
                    } else {
                        const logSeverity = message.severity === 1 ? log.warn : log.error;
                        logSeverity(
                            `   [${message.ruleId}] ${message.message} (file ${result.filePath}:${message.line}:${message.column})`
                        );
                    }
                }
            }
        }
        isCI && endGroup();
    }
});
