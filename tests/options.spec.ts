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

import { test, expect, beforeEach } from 'bun:test';
import { inferOptions } from '../src/config';

beforeEach(() => {
    process.env = Object.keys(process.env).reduce((acc, curr) => {
        if (!curr.startsWith('INPUT_')) acc[curr] = process.env[curr];

        return acc;
    }, {});
});

test('resolve default options', async () => {
    setInput('access-key-id', 'blah');
    setInput('secret-key', 'blah');
    setInput('bucket', 'noel');

    const options = await inferOptions();
    expect(options).toMatchSnapshot();
});

// See: https://github.com/actions/toolkit/blob/a1b068ec31a042ff1e10a522d8fdf0b8869d53ca/packages/core/src/core.ts#L89
function getInputName(name: string) {
    return `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
}

function setInput(name: string, value: string) {
    process.env[getInputName(name)] = value;
}
