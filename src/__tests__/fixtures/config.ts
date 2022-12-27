import { SqliteOptions } from '../../types';

export const drivers: { [key: string]: SqliteOptions } = {
    sqlite: {
        path: __dirname + '/../../../.sqlite.db'
    },
    sqlite3: {
        path: __dirname + '/../../../.sqlite3.db'
    }
};

export const tests: Array<[string, SqliteOptions]> = Object.keys(drivers).map(driver => [driver, drivers[driver]]);
