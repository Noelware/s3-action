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

import * as core from '@actions/core';
import * as glob from '@actions/glob';
import { lstat } from 'fs/promises';
import S3 from './s3-client';

const overwriteLogger = () => {
  const originalCoreLog = core.info;
  const originalCoreDebug = core.debug;

  // @ts-expect-error I know I'm not supposed to do this but whatever
  core.info = (message: string) => {
    return originalCoreLog(`[${new Date().toTimeString()}] ${message}`);
  };

  // @ts-expect-error I know I'm not supposed to do this but whatever
  core.debug = (message: string) => {
    return originalCoreDebug(`[${new Date().toTimeString()}] ${message}`);
  };
};

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
  const exclude = _directories.split(';');

  core.info(`Exclude Dirs: ${exclude.join(', ')}`);
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

  let shouldExclude: string[] = [];

  for (let i = 0; i < exclude.length; i++) {
    const globber = await glob.create(exclude[i]);
    const files = await globber.glob();

    shouldExclude = shouldExclude.concat(files);
  }

  for (let i = 0; i < directories.length; i++) {
    const globber = await glob.create(directories[i]);
    const files = await globber.glob();

    core.info(`Found ${files.length} files to upload...`);
    for (let f = 0; f < files.length; f++) {
      const file = files[f];
      const stats = await lstat(file);

      // Skip on excluded dirs / files
      if (shouldExclude.includes(file))
        continue;

      // Skip on directories
      if (stats.isDirectory())
        continue;

      console.log(file);
    }
  }
})();
