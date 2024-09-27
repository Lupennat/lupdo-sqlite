import { SqliteOptions } from '../../src';

export const pdoData: { driver: string; config: SqliteOptions } = {
  driver: 'sqlite3',
  config: {
    path: __dirname + '/../../.sqlite3.db',
  },
};
