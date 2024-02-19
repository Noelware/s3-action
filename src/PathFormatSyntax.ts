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

import { execSync } from 'child_process';
import { warning } from '@actions/core';

/**
 * Represents the list of matchers that are available.
 */
export interface Matchers {
    branch(): string;
    arch(): string;
    tag(): string;
    os(): string;

    prefix: boolean;
    file: boolean;
}

/**
 * Represents a object of given {@link Matchers}.
 */
export const MATCHERS: Matchers = {
    branch() {
        try {
            return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
        } catch {
            return '';
        }
    },

    arch() {
        switch (process.arch) {
            case 'x64':
                return 'amd64';

            case 'arm64':
                return 'aarch64';

            default:
                return process.platform;
        }
    },

    tag() {
        const ref = process.env.GITHUB_REF;
        if (!ref) return '';
        if (!ref.startsWith('ref/tags/')) {
            warning(`Unable to determine if [${ref}] is a tagged reference (reason: didn't start with refs/tags/)`);
            return '';
        }

        return ref.replace(/^refs\/tags\//, '');
    },

    os() {
        switch (process.platform) {
            case 'win32':
                return 'windows';

            case 'darwin':
                return 'macos';

            default:
                return process.platform;
        }
    },

    prefix: true,
    file: true
};

/**
 * Parses the given syntax string and returns a new string that replaces anything with `$()` with the given value,
 * if it has a given matcher.
 *
 * @param syntax        The syntax string to parse
 * @param param1.prefix The prefix to use, defaults to `/`
 * @param param1.file   The file path to use
 * @returns A new string that replaces anything from `$()`, if it has a matcher for it.
 * @example
 * ```ts
 * import { parsePathFormatSyntax } from '@noelware/s3-action';
 *
 * console.log(parsePathFormatSyntax('$(prefix)/$(file)', { prefix: '/', file: 'src/main.ts' }));
 * // => "/src/main.ts"
 * ```
 */
export const parsePathFormatSyntax = (syntax: string, { prefix, file }: Record<'file' | 'prefix', string>) => {
    const result = syntax.replace(/[$]\(([\w\.]+)\)/g, (_, key) => {
        const matcher = MATCHERS[key] as (() => string) | boolean;
        if (!matcher) return key;

        if (typeof matcher === 'boolean' && matcher === true) {
            switch (key) {
                case 'prefix':
                    return prefix;
                case 'file':
                    return file;
                default:
                    throw new TypeError(`Unknown matcher [${key}]`);
            }
        } else {
            return matcher();
        }
    });

    if (result[0] === prefix && result[1] === prefix) {
        return result.substring(1);
    }

    return result;
};
