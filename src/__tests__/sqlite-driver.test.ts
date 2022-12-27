import Database from 'better-sqlite3';
import {
    ATTR_DEBUG,
    DEBUG_ENABLED,
    Pdo,
    PdoConnectionI,
    PdoError,
    PdoI,
    PdoPreparedStatement,
    PdoStatement,
    PdoTransaction
} from 'lupdo';
import SqliteDriver from '../sqlite-driver';
import { drivers, tests } from './fixtures/config';

describe('Sqlite Driver', () => {
    const sleep = function (timeout: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, timeout);
        });
    };

    const pdos: { [key: string]: PdoI } = {};
    beforeAll(() => {
        SqliteDriver.createAggregate('max_len', {
            start: 0,
            step: (context: number, nextValue: string) => {
                if (nextValue.length > context) {
                    return nextValue.length;
                }
                return context;
            }
        });

        SqliteDriver.createFunction('add2', {
            execute(a, b) {
                return a + b;
            }
        });

        for (const driver in drivers) {
            pdos[driver] = new Pdo(driver, drivers[driver]);
        }
    });

    afterAll(async () => {
        for (const driver in pdos) {
            await pdos[driver].disconnect();
        }
    });

    it('Works Driver Registration', () => {
        expect(Pdo.getAvailableDrivers()).toEqual(['sqlite', 'sqlite3']);
    });

    it.each(tests)('Works $driver Create Aggregate', async driver => {
        const stmt = await pdos[driver].query('SELECT max_len(name) FROM companies;');
        expect(stmt.fetchColumn<number>(0).all()).toEqual([25]);
    });

    it.each(tests)('Works $driver Create Function', async driver => {
        const stmt = await pdos[driver].query('SELECT add2(name, gender) FROM users;');
        expect(stmt.fetchColumn<string>(0).get()).toBe('EdmundMultigender');
        expect(stmt.fetchColumn<string>(0).get()).toBe('KyleighCis man');
        expect(stmt.fetchColumn<string>(0).get()).toBe('JosefaCisgender male');
    });

    it.each(tests)('Works $driver BeginTransaction Return Transaction', async driver => {
        const trx = await pdos[driver].beginTransaction();
        expect(trx).toBeInstanceOf(PdoTransaction);
        await trx.rollback();
    });

    it.each(tests)('Works $driver Exec Return Number', async driver => {
        const res = await pdos[driver].exec('SELECT 1');
        expect(typeof res === 'number').toBeTruthy();
        expect(res).toEqual(0);
        expect(await pdos[driver].exec("INSERT INTO users (name, gender) VALUES ('Claudio', 'All');")).toEqual(1);
    });

    it.each(tests)('Works $driver Exec Fails', async driver => {
        await expect(pdos[driver].exec('SELECT ?')).rejects.toThrow(PdoError);
    });

    it.each(tests)('Works $driver Query Return PdoStatement', async driver => {
        const stmt = await pdos[driver].query('SELECT 1');
        expect(stmt).toBeInstanceOf(PdoStatement);
    });

    it.each(tests)('Works $driver Query Fails', async driver => {
        await expect(pdos[driver].query('SELECT ?')).rejects.toThrow(PdoError);
    });

    it.each(tests)('Works $driver Prepare Return PdoPreparedStatement', async driver => {
        const stmt = await pdos[driver].prepare('SELECT 1');
        expect(stmt).toBeInstanceOf(PdoPreparedStatement);
        await stmt.execute();
        await stmt.close();
    });

    it.each(tests)('Works $driver Prepare Fails', async driver => {
        await expect(pdos[driver].prepare('SELECT ??')).rejects.toThrow(PdoError);
    });

    it.each(tests)('Works $driver Get Raw Pool Connection', async driver => {
        const raw = await pdos[driver].getRawPoolConnection();
        expect(raw.connection).toBeInstanceOf(Database);

        await raw.release();
    });

    it.each(tests)('Works $driver Connection On Create', async (driver, config) => {
        const pdo = new Pdo(
            driver,
            config,
            {
                created: async (uuid: string, connection: PdoConnectionI) => {
                    await connection.query('cache_size = 28000');
                }
            },
            {}
        );

        const stmt = await pdo.prepare(`PRAGMA cache_size`);
        await stmt.execute();
        expect(stmt.fetchColumn<number>(0).get()).toBe(28000);
        await stmt.close();
        await pdo.disconnect();
    });

    it.each(tests)('Works $driver Debug', async (driver, config) => {
        console.log = jest.fn();
        console.trace = jest.fn();
        const pdo = new Pdo(driver, config, {}, { [ATTR_DEBUG]: DEBUG_ENABLED });
        await pdo.query('SELECT 1');
        expect(console.log).toHaveBeenCalled();
        await pdo.disconnect();
    });

    it.each(tests)('Works $driver Debug Not Override Verbose', async (driver, config) => {
        console.log = jest.fn();
        console.trace = jest.fn();
        const queries: any[] = [];
        const pdo = new Pdo(
            driver,
            {
                ...config,
                verbose(...args: any[]) {
                    queries.push(args);
                }
            },
            {},
            { [ATTR_DEBUG]: DEBUG_ENABLED }
        );

        await pdo.query('SELECT 1');
        expect(console.log).toHaveBeenCalled();
        expect(queries.length).toBeGreaterThan(0);
        await pdo.disconnect();
    });

    it.each(tests)('Works $driver Destroy Connection Does not kill connection', async (driver, config) => {
        console.log = jest.fn();
        console.trace = jest.fn();

        const events: {
            killed: {
                [key: string]: number;
            };
        } = {
            killed: {}
        };

        const pdo = new Pdo(
            driver,
            config,
            {
                killTimeoutMillis: 500,
                killResource: true,
                max: 1,
                min: 1,
                acquired: () => {
                    setTimeout(async () => {
                        await pdo.disconnect();
                    }, 1000);
                },
                killed(uuid: string): void {
                    events.killed[uuid] = events.killed[uuid] == null ? 1 : events.killed[uuid] + 1;
                }
            },
            { [ATTR_DEBUG]: DEBUG_ENABLED }
        );
        const stmt = await pdo.prepare('SELECT 1;');
        // sleep only to simulate pdo.disconnect
        await sleep(3000);
        // kill connection can do nothing
        // sqlite doesn't have KILL QUERY
        // it throw an error because connection is signed as killed
        await expect(stmt.execute()).rejects.toThrow('Data are compromised');
        expect(Object.keys(events.killed).length).toBe(1);
        await expect(console.log).toHaveBeenCalled();
    });
});
