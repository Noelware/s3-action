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

import { info, warning, error, setFailed } from '@actions/core';
import { ESLint } from 'eslint';

async function main() {
  info('Now running ESLint...');

  const linter = new ESLint({ useEslintrc: true });
  const results = await linter.lintFiles(['src/**/*.ts']);

  for (const result of results) {
    info(`Received ${result.warningCount} warnings and ${result.errorCount} errors.`);

    for (const message of result.messages) {
      const log = message.severity === 1 ? warning : error;
      log(`${result.filePath}:${message.line}:${message.column} <${message.ruleId}> ~ ${message.message}`, {
        file: result.filePath,
        endColumn: message.endColumn,
        endLine: message.endLine,
        startColumn: message.column,
        startLine: message.line,
        title: `${message.ruleId}: ${message.message}`
      });
    }
  }
}

main().catch((ex) => setFailed(ex));
