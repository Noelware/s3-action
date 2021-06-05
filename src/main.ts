/**
 * `@noelware/gh-s3-action` is a GitHub Action to publish contents of a
 * GitHub repository to a S3 bucket.
 *
 * Copyright (c) 2021-present Noelware
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { createReadStream, lstat as _lstat } from 'fs';
import { promisify } from 'util';
import { execSync } from 'child_process';
import { Config } from './config';
import * as util from './utils';
import * as core from '@actions/core';
import * as glob from '@actions/glob';
import S3 from './s3-client';

interface S3ActionConfig {
  'upload-this-branch'?: boolean;
  'object-format'?: string;
  'use-wasabi'?: boolean;
  'secret-key': string;
  'access-key': string;
  directories: string[];
  exclude?: string[];
  region?: string;
  bucket: string;
}

const lstat = promisify(_lstat);
const config = new Config<S3ActionConfig>({
  'upload-this-branch': <any> core.getInput('upload-this-branch', { trimWhitespace: true }),
  'object-format': core.getInput('object-format', { trimWhitespace: true }),
  'use-wasabi': <any> core.getInput('use-wasabi', { trimWhitespace: true }),
  'access-key': <any> core.getInput('access-key', { trimWhitespace: true }),
  'secret-key': <any> core.getInput('secret-key', { trimWhitespace: true }),
  directories: <any> core.getInput('directories', { trimWhitespace: true }),
  exclude: <any> core.getInput('exclude', { trimWhitespace: true }),
  region: <any> core.getInput('region', { trimWhitespace: true }),
  bucket: core.getInput('bucket', { trimWhitespace: true })
}, {
  'upload-this-branch': {
    required: false,
    type: 'boolean'
  },

  'object-format': {
    required: false,
    type: 'string'
  },

  'use-wasabi': {
    required: false,
    type: 'boolean'
  },

  'access-key': {
    required: true,
    type: 'string'
  },

  'secret-key': {
    required: true,
    type: 'string'
  },

  directories: {
    required: true,
    type: 'array'
  },

  exclude: {
    required: false,
    type: 'array'
  },

  region: {
    required: false,
    type: 'string'
  },

  bucket: {
    required: false,
    type: 'string'
  }
});

(async() => {
  util.overwriteLogger();
  config.validate();

  // Since core.setFailed only sets the process exit code
  // we have to handle it ourselves.
  console.log(process.exitCode);
  if (process.exitCode !== undefined)
    process.exit(process.exitCode);

  const secretKey = config.getInput('secret-key', '')!;
  const accessKey = config.getInput('access-key', '');
  const excludeDirs = config.getInput('exclude', []);
  const useWasabi = config.getInput('use-wasabi', false);
  const directories = config.getInput('directories', []);
  const region = config.getInput('region', 'us-east-1');
  const bucketName = config.getInput('bucket', '');

  core.info([
    '',
    `> Exclude Directories: ${(excludeDirs || []).join(', ') || 'None set.'}`,
    `> Use Wasabi Servers : ${useWasabi ? 'Yes' : 'No'}`,
    `> Directories        : ${directories.join(', ')}`,
    `> Bucket Region      : ${region}`
  ].join('\n'));

  const s3 = new S3(
    accessKey,
    secretKey,
    bucketName,
    useWasabi,
    region
  );

  try {
    await s3.verifyBucket();
    core.info('Setup S3 client, now globbing over directories...');
  } catch(ex) {
    core.setFailed(`Unable to verify S3: ${ex.message}`);
    return;
  }

  const shouldExclude: string[] = [];
  const excludePatterns = await glob.create((excludeDirs || []).join('\n'), {
    followSymbolicLinks: true // TODO: make this into a config variable
  });

  core.info('Linking excluding directories...');
  for await (const file of excludePatterns.globGenerator())
    shouldExclude.push(file);

  core.info('Checking directories...');
  const dirGlob = await glob.create(directories.filter(d => !shouldExclude.includes(d)).join('\n'), {
    followSymbolicLinks: true // TODO: make this into a config variable
  });

  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

  for await (const file of dirGlob.globGenerator()) {
    core.info(`File "${file}" found.`);
    const stats = await lstat(file);

    // Skip on directories
    if (stats.isDirectory())
      continue;

    const format = config.getInput('object-format', '')!
      .replace(/[$]\(([\w\.]+)\)/g, (_, key) => {
        switch (key) {
          case 'file':
            return file.replace(process.cwd(), '').slice(1);

          case 'branch':
            return branch;

          default:
            return key;
        }
      });

    const stream = createReadStream(file);
    const objName = config.getInput('upload-this-branch', false)
      ? `${branch}/${format}`
      : format || file.replace(process.cwd(), '').slice(1);

    await s3.upload(objName, stream);
  }
})();
