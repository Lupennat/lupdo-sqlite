import { Pdo, PdoAttributes, PdoPoolOptions } from 'lupdo';

import SqliteDriver from './sqlite-driver';
import { SqliteOptions } from './types';
Pdo.addDriver('sqlite', SqliteDriver);
Pdo.addDriver('sqlite3', SqliteDriver);

export function createSqlitePdo(
  options: SqliteOptions,
  poolOptions?: PdoPoolOptions,
  attributes?: PdoAttributes,
): Pdo {
  return new Pdo('sqlite', options, poolOptions, attributes);
}

export { default as SqliteDriver } from './sqlite-driver';
export * from './types';
