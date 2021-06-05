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

type PrimitiveTypes = 'string' | 'boolean' | 'array';

type ConfigSchema<T> = {
  [P in keyof T]: IConfigInterface;
}

interface IConfigInterface {
  required?: boolean;
  type: PrimitiveTypes;
}

const BOOLEAN_TYPES = [
  'true',
  'false',
  'on',
  'off',
  'enable',
  'disable'
];

export class Config<T> {
  private _schema: ConfigSchema<T>;
  private _config: T;

  constructor(opts: T, schema: ConfigSchema<T>) {
    this._config = opts;
    this._schema = schema;
  }

  validate() {
    for (const key in this._config) {
      const value = this._config[key] as any;
      const schema = this._schema[key];

      core.debug(`Validating option '${key}'...`);
      switch (schema.type) {
        case 'string': {
          if (schema.required === true && value === '')
            return core.setFailed(`[schema:validate:${key}] Key is required but nothing was provided`);

          if (typeof value !== 'string')
            return core.setFailed(`[schema:validate:${key}] Expected 'string', received ${typeof value}`);
        } break;

        case 'boolean': {
          if (schema.required === true && value === '')
            return core.setFailed(`[schema:validate:${key}] Key is required but nothing was provided`);

          if (!BOOLEAN_TYPES.includes(value))
            return core.setFailed(`[schema:validate:${key}] Expected ${BOOLEAN_TYPES.map(v => `"${v}"`).join(', ')} but received "${value}"`);
        } break;

        case 'array': {
          if (schema.required === true && value === '')
            return core.setFailed(`[schema:validate:${key}] Key is required but nothing was provided`);
        }
      }
    }

    core.info('✅ Validated configuration, can continue.');
  }

  getInput<K extends keyof T>(key: K, defaultValue: T[K]): T[K] {
    const input = core.getInput(key as string);
    const schema = this._schema[key];
    if (!schema)
      throw new TypeError('Missing schema for key: ' + key);

    if (!input)
      return defaultValue;

    switch (schema.type) {
      case 'string':
        return input as unknown as T[K];

      case 'boolean':
        const truthyValue = input === 'true' || input === 'on' || input === 'enable';
        return Boolean(truthyValue) as unknown as T[K];

      case 'array':
        return input.split(';') as unknown as T[K];

      default:
        throw new TypeError(`Invalid schema type: "${schema.type}"`);
    }
  }
}
