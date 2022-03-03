/*
 * ☕ @noelware/s3-action: GitHub Action to publish contents of a GitHub repository to a S3 bucket.
 * Copyright (c) 2021-2022 Noelware
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

/**
 * Overwrites `@actions/core` logging utilities to print out a date as the prefix
 */
export const overwriteLogger = () => {
  const originalCoreLog = core.info;
  const originalCoreDebug = core.debug;

  // @ts-expect-error I know I'm not supposed to do this but whatever
  core.info = (message: string) => {
    const date = new Date();
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

    return originalCoreLog(
      `[${`0${date.getHours()}`.slice(-2)}:${`0${date.getMinutes()}`.slice(-2)}:${`0${date.getSeconds()}`.slice(
        -2
      )} ${ampm}] ${message}`
    );
  };

  // @ts-expect-error I know I'm not supposed to do this but whatever
  core.debug = (message: string) => {
    const date = new Date();
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

    return originalCoreDebug(
      `[${`0${date.getHours()}`.slice(-2)}:${`0${date.getMinutes()}`.slice(-2)}:${`0${date.getSeconds()}`.slice(
        -2
      )} ${ampm}] ${message}`
    );
  };
};
