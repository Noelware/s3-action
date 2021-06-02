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
import S3 from './s3-client';

(async() => {
  const _directories = core.getInput('directories', { trimWhitespace: true }) || '';
  const accessKey   = core.getInput('access-key',  { trimWhitespace: true }) || '';
  const secretKey   = core.getInput('secret-key',  { trimWhitespace: true }) || '';
  const useWasabi   = Boolean(core.getInput('use-wasabi', { trimWhitespace: true }) || 'true');
  const region      = core.getInput('region', { trimWhitespace: true }) || 'us-east-1';
  const bucketName  = core.getInput('bucket', { trimWhitespace: true }) || '';

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
  core.debug(`Using Wasabi: ${useWasabi ? 'Yes' : 'No'}`);
  core.debug(`Directories : ${directories.join(', ')}`);
  core.debug(`Region:     : ${region}`);

  const s3 = new S3(
    accessKey,
    secretKey,
    bucketName,
    useWasabi,
    region
  );

  try {
    await s3.verifyBucket();
  } catch(ex) {
    core.setFailed(`Unable to verify S3: ${ex.message}`);
    return;
  }

  // for (let i = 0; i < directories.length; i++) {
  //   const globber = await glob.create(directories[i]);
  //   const files = await globber.glob();

  //   core.info(`Found ${files.length} files to upload...`);
  // }
})();
