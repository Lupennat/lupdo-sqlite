import Database from 'better-sqlite3';

import { ATTR_DEBUG, DEBUG_ENABLED, PdoConnectionI, PdoDriver, PdoRawConnectionI } from 'lupdo';
import PdoAttributes from 'lupdo/dist/typings/types/pdo-attributes';
import { PoolOptions } from 'lupdo/dist/typings/types/pdo-pool';
import SqliteConnection from './sqlite-connection';
import SqliteRawConnection from './sqlite-raw-connection';
import { SqliteOptions, SqlitePoolConnection } from './types';

export type SqliteAggregateOptions = Database.AggregateOptions;
export interface SqliteFunctionOptions extends Database.RegistrationOptions {
    execute: (...params: any[]) => any;
}

class SqliteDriver extends PdoDriver {
    protected static aggregateFunctions: {
        [key: string]: SqliteAggregateOptions;
    } = {};

    protected static functions: {
        [key: string]: SqliteFunctionOptions;
    } = {};

    constructor(driver: string, protected options: SqliteOptions, poolOptions: PoolOptions, attributes: PdoAttributes) {
        super(driver, poolOptions, attributes);
    }

    protected async createConnection(unsecure = false): Promise<SqlitePoolConnection> {
        const { path, ...sqliteOptions } = this.options;
        const debugMode = this.getAttribute(ATTR_DEBUG) as number;

        if (!unsecure && debugMode === DEBUG_ENABLED) {
            const customVerbose = sqliteOptions.verbose;
            sqliteOptions.verbose = (...args) => {
                if (typeof customVerbose === 'function') {
                    customVerbose.call(customVerbose, ...args);
                }
                console.log(...args);
            };
        }

        const db = new Database(path, sqliteOptions);

        for (const name in SqliteDriver.aggregateFunctions) {
            db.aggregate(name, SqliteDriver.aggregateFunctions[name]);
        }

        for (const name in SqliteDriver.functions) {
            const opts = SqliteDriver.functions[name];
            const { execute, ...options } = opts;

            db.function(name, options, execute);
        }

        if (!unsecure) {
            db.defaultSafeIntegers(true);
        }

        return db as SqlitePoolConnection;
    }

    protected createPdoConnection(connection: SqlitePoolConnection): PdoConnectionI {
        return new SqliteConnection(connection);
    }

    protected async closeConnection(connection: SqlitePoolConnection): Promise<void> {
        await connection.close();
    }

    protected async destroyConnection(): Promise<void> {
        // sqlite does not support kill query
        return void 0;
    }

    protected validateRawConnection(): boolean {
        return true;
    }

    public getRawConnection(): PdoRawConnectionI {
        return new SqliteRawConnection(this.pool);
    }

    /**
     * https://sqlite.org/lang_aggfunc.html
     * @param name
     * @param options https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md#aggregatename-options---this
     */
    public static createAggregate(name: string, options: SqliteAggregateOptions): void {
        SqliteDriver.aggregateFunctions[name] = options;
    }

    /**
     *
     * @param name
     * @param options https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md#functionname-options-function---this
     */
    public static createFunction(name: string, options: SqliteFunctionOptions): void {
        SqliteDriver.functions[name] = options;
    }
}

export default SqliteDriver;
