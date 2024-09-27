import { stat } from 'node:fs/promises';

import * as Database from 'better-sqlite3';
import {
  ATTR_DEBUG,
  DEBUG_ENABLED,
  PdoAttributes,
  PdoConnectionI,
  PdoDriver,
  PdoPoolOptions,
  PdoRawConnectionI,
  PoolConnection,
  PoolI,
} from 'lupdo';

import SqliteConnection from './sqlite-connection';
import SqliteRawConnection from './sqlite-raw-connection';
import {
  SqliteAggregateOptions,
  SqliteFunctionOptions,
  SqliteOptions,
  SqlitePoolConnection,
} from './types';

export class SqliteDriver extends PdoDriver {
  protected walWatcherInterval: NodeJS.Timer | undefined;
  protected options: SqliteOptions;

  protected static aggregateFunctions: {
    [key: string]: SqliteAggregateOptions;
  } = {};

  protected static functions: {
    [key: string]: SqliteFunctionOptions;
  } = {};

  constructor(
    driver: string,
    options: SqliteOptions,
    poolOptions: PdoPoolOptions,
    attributes: PdoAttributes,
  ) {
    super(driver, poolOptions, attributes);
    if (this.isMemoryDatabase(options.path)) {
      options.wal = false;
      options.walSynchronous = undefined;
      options.walMaxSize = undefined;
      options.onWalError = undefined;
    }
    this.options = options;
  }

  protected isMemoryDatabase(path: string): boolean {
    return path.toLowerCase() === ':memory:';
  }

  protected get pool(): PoolI<PoolConnection> {
    if (this.walWatcherInterval === undefined) {
      if ((this.options.wal ?? false) && (this.options.walMaxSize ?? 0)) {
        this.enableWalWatcher(this.options.walMaxSize!);
      }
    }

    return super.pool;
  }

  protected async createConnection(
    unsecure = false,
  ): Promise<SqlitePoolConnection> {
    const { path, wal, walSynchronous, ...sqliteOptions } = this.options;
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

    const db = new Database(path, sqliteOptions) as SqlitePoolConnection;

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
    if (wal ?? false) {
      await db.pragma('journal_mode = WAL');
      await db.pragma(`synchronous = ${walSynchronous ?? 'NORMAL'}`);
    } else {
      await db.pragma(
        `journal_mode = ${this.isMemoryDatabase(path) ? 'memory' : 'delete'}`,
      );
    }
    return db;
  }

  public async disconnect(): Promise<void> {
    return super.disconnect();
  }

  protected enableWalWatcher(walMaxSize: number): void {
    this.emit('log', 'debug', `WAL enabled with max size ${walMaxSize}mb.`);
    this.walWatcherInterval = setInterval(async () => {
      if (this.disconnected) {
        clearInterval(this.walWatcherInterval as NodeJS.Timeout);
        this.walWatcherInterval = undefined;
      } else {
        const path = this.options.path + '-wal';
        try {
          const sizeInMB = await this.getFileSizeInMb(path);
          if (sizeInMB > walMaxSize) {
            const newConn = await this.createConnection();
            await newConn.pragma('wal_checkpoint(TRUNCATE)');
            await newConn.close();
            this.emit(
              'log',
              'warning',
              `WAL checkpoint TRUNCATE called, file size ${sizeInMB}mb is greater than ${walMaxSize}mb.`,
            );
          }
        } catch (err: any) {
          if (typeof this.options.onWalError === 'function') {
            await this.options.onWalError(err);
          }
        }
      }
    }, 5000).unref();
  }

  protected async getFileSizeInMb(path: string): Promise<number> {
    const stats = await stat(path);
    return Math.round(stats.size * 0.0001) / 100;
  }

  protected createPdoConnection(
    connection: SqlitePoolConnection,
  ): PdoConnectionI {
    return new SqliteConnection(connection);
  }

  protected async closeConnection(
    connection: SqlitePoolConnection,
  ): Promise<void> {
    await connection.close();
  }

  protected async destroyConnection(): Promise<void> {
    // sqlite does not support kill query
    return void 0;
  }

  protected validateRawConnection(): boolean {
    return true;
  }

  protected async getVersionFromConnection(
    connection: SqlitePoolConnection,
  ): Promise<string> {
    const stmt = connection.prepare('SELECT sqlite_version() as version');
    const res = (await stmt.get()) as { version: string };
    return res.version;
  }

  public getRawConnection(): PdoRawConnectionI {
    return new SqliteRawConnection(this.pool);
  }

  /**
   * https://sqlite.org/lang_aggfunc.html
   * @param name
   * @param options https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md#aggregatename-options---this
   */
  public static createAggregate(
    name: string,
    options: SqliteAggregateOptions,
  ): void {
    SqliteDriver.aggregateFunctions[name] = options;
  }

  /**
   *
   * @param name
   * @param options https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md#functionname-options-function---this
   */
  public static createFunction(
    name: string,
    options: SqliteFunctionOptions,
  ): void {
    SqliteDriver.functions[name] = options;
  }
}

export default SqliteDriver;
