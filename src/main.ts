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

import { lstat as _lstat } from 'fs';
import { promisify } from 'util';
import * as core from '@actions/core';
import * as glob from '@actions/glob';
import S3 from './s3-client';

const overwriteLogger = () => {
  const originalCoreLog = core.info;
  const originalCoreDebug = core.debug;

  // @ts-expect-error I know I'm not supposed to do this but whatever
  core.info = (message: string) => {
    const date = new Date();
    return originalCoreLog(`[${`0${date.getHours()}`.slice(-2)}:${`0${date.getMinutes()}`.slice(-2)}:${`0${date.getSeconds()}`.slice(-2)}] ${message} ${message}`);
  };

  // @ts-expect-error I know I'm not supposed to do this but whatever
  core.debug = (message: string) => {
    const date = new Date();
    return originalCoreDebug(`[${`0${date.getHours()}`.slice(-2)}:${`0${date.getMinutes()}`.slice(-2)}:${`0${date.getSeconds()}`.slice(-2)}] ${message}`);
  };
};

const lstat = promisify(_lstat);

(async() => {
  overwriteLogger();

  const _directories = core.getInput('directories', { trimWhitespace: true }) || '';
  const accessKey   = core.getInput('access-key',  { trimWhitespace: true }) || '';
  const secretKey   = core.getInput('secret-key',  { trimWhitespace: true }) || '';
  const useWasabi   = Boolean(core.getInput('use-wasabi', { trimWhitespace: true }) || 'true');
  const region      = core.getInput('region', { trimWhitespace: true }) || 'us-east-1';
  const bucketName  = core.getInput('bucket', { trimWhitespace: true }) || '';
  const _excludeDirs = core.getInput('exclude', { trimWhitespace: true }) || '';

  if (
    _directories === '' ||
    accessKey === '' ||
    secretKey === '' ||
    bucketName === ''
  ) {
    core.setFailed('Missing one or more configuration inputs: `directories`, `accessKey`, `secretKey`, `bucket`.');
    return;
  }

  const directories = _directories.split(';');
  const exclude = _excludeDirs.split(';');

  core.info(`Exclude Dirs: ${exclude.join(', ') || 'No directories set.'}`);
  core.info(`Using Wasabi: ${useWasabi ? 'Yes' : 'No'}`);
  core.info(`Directories : ${directories.join(', ')}`);
  core.info(`Region:     : ${region}`);

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
  const excludePatterns = await glob.create(exclude.join('\n'), {
    followSymbolicLinks: true // TODO: make this into a config variable
  });

  core.info('Linking excluding directories...');
  for await (const file of excludePatterns.globGenerator())
    shouldExclude.push(file);

  core.info('Checking directories...');
  const dirGlob = await glob.create(directories.filter(d => !shouldExclude.includes(d)).join('\n'), {
    followSymbolicLinks: true // TODO: make this into a config variable
  });

  for await (const file of dirGlob.globGenerator()) {
    core.info(`File "${file}" found.`);
    const stats = await lstat(file);

    // Skip on directories
    if (stats.isDirectory())
      continue;
  }
})();
