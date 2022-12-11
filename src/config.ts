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

import { getInput, InputOptions } from '@actions/core';
import z from 'zod';

const configSchema = z
  .object({
    enforcePathAccessStyle: z.boolean().default(false),
    followSymlinks: z.boolean().default(false),
    accessKeyId: z.string(),
    directories: z.array(z.string()).default([]),
    pathFormat: z.string().default('$(prefix)/$(file)'),
    secretKey: z.string(),
    bucketAcl: z.string().default('public-read'),
    objectAcl: z.string().default('public-read'),
    endpoint: z.string().default('s3.amazonaws.com'),
    exclude: z.array(z.string()).default([]),
    region: z.string().default('us-east-1'),
    prefix: z.string().startsWith('/', '`prefix` must start with /'),
    bucket: z.string(),
    files: z.array(z.string()).default([])
  })
  .strict();

const truthy = new Set(['true', 'True', 'TRUE']);
const falsy = new Set(['false', 'False', 'FALSE']);

const getBooleanInput = (name: string, options: InputOptions) => {
  const value = getInput(name, options);
  if (!value) return false;
  if (truthy.has(value)) return true;
  if (falsy.has(value)) return false;

  throw new Error(`Value of key [${name}] didn't meet the Yaml 1.2 "Core Schema" specification (received: [${value}])`);
};

/**
 * Represents the configuration schema's type.
 */
export type InputConfig = z.infer<typeof configSchema>;

/**
 * Infers all the options and validates them from the {@link configSchema configuration schema}.
 */
export const inferOptions = (): Promise<InputConfig> => {
  const directories = getInput('directories', { trimWhitespace: true })
    .split(',')
    .map((i) => i.trim());

  const enforcePathAccessStyle = getBooleanInput('enforce-path-access-style', { trimWhitespace: true });
  const followSymlinks = getBooleanInput('follow-symlinks', { trimWhitespace: true });
  const accessKeyId = getInput('access-key-id', { trimWhitespace: true, required: true });
  const pathFormat = getInput('path-format', { trimWhitespace: true });
  const bucketAcl = getInput('bucket-acl', { trimWhitespace: true });
  const objectAcl = getInput('object-acl', { trimWhitespace: true });
  const secretKey = getInput('secret-key', { trimWhitespace: true, required: true });
  const endpoint = getInput('endpoint', { trimWhitespace: true });
  const prefix = getInput('prefix', { trimWhitespace: true });
  const bucket = getInput('bucket', { trimWhitespace: true, required: true });
  const region = getInput('region', { trimWhitespace: true });
  const exclude = getInput('exclude', { trimWhitespace: true })
    .split(',')
    .map((i) => i.trim());

  const files = getInput('files', { trimWhitespace: true })
    .split(',')
    .map((i) => i.trim());

  return configSchema.parseAsync({
    enforcePathAccessStyle,
    followSymlinks,
    directories,
    accessKeyId,
    pathFormat,
    bucketAcl,
    objectAcl,
    secretKey,
    endpoint,
    exclude,
    prefix,
    bucket,
    region,
    files
  });
};
