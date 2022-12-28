import { SqliteOptions } from '../../types';

export const drivers: {
    [key: string]: SqliteOptions;
} = {
    sqlite3: {
        path: __dirname + '/../../../.sqlite3.db'
    }
};

const currentDB: string = process.env.DB as string;

export const pdoData: { driver: string; config: SqliteOptions } = {
    driver: 'sqlite3',
    config: drivers[currentDB]
};
