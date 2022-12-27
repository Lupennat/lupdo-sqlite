import { Pdo } from 'lupdo';
import SqliteDriver from './sqlite-driver';
Pdo.addDriver('sqlite', SqliteDriver);
Pdo.addDriver('sqlite3', SqliteDriver);

export { default as SqliteDriver } from './sqlite-driver';
export * from './types';
