import Database, { Database as Connection } from 'better-sqlite3';
import {
    ATTR_DEBUG,
    DEBUG_ENABLED,
    Pdo,
    PdoConnectionI,
    PdoError,
    PdoPreparedStatement,
    PdoStatement,
    PdoTransaction
} from 'lupdo';

import SqliteDriver from '../sqlite-driver';
import { pdoData } from './fixtures/config';

describe('Sqlite Driver', () => {
    const pdo = new Pdo(pdoData.driver, pdoData.config);

    const sleep = function (timeout: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, timeout);
        });
    };

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
    });

    afterAll(async () => {
        await pdo.disconnect();
    });

    it('Works Driver Registration', () => {
        expect(Pdo.getAvailableDrivers()).toEqual(['sqlite', 'sqlite3']);
    });

    it('Works Create Aggregate', async () => {
        const stmt = await pdo.query('SELECT max_len(name) FROM companies;');
        expect(stmt.fetchColumn<number>(0).all()).toEqual([25]);
    });

    it('Works Create Function', async () => {
        const stmt = await pdo.query('SELECT add2(name, gender) FROM users;');
        expect(stmt.fetchColumn<string>(0).get()).toBe('EdmundMultigender');
        expect(stmt.fetchColumn<string>(0).get()).toBe('KyleighCis man');
        expect(stmt.fetchColumn<string>(0).get()).toBe('JosefaCisgender male');
    });

    it('Works BeginTransaction Return Transaction', async () => {
        const trx = await pdo.beginTransaction();
        expect(trx).toBeInstanceOf(PdoTransaction);
        await trx.rollback();
    });

    it('Works Exec Return Number', async () => {
        const res = await pdo.exec('SELECT 1');
        expect(typeof res === 'number').toBeTruthy();
        expect(res).toEqual(0);
        const trx = await pdo.beginTransaction();
        expect(await trx.exec("INSERT INTO users (name, gender) VALUES ('Claudio', 'All');")).toEqual(1);
        await trx.rollback();
    });

    it('Works Exec Fails', async () => {
        await expect(pdo.exec('SELECT ?')).rejects.toThrow(PdoError);
    });

    it('Works Query Return PdoStatement', async () => {
        const stmt = await pdo.query('SELECT 1');
        expect(stmt).toBeInstanceOf(PdoStatement);
    });

    it('Works Query Fails', async () => {
        await expect(pdo.query('SELECT ?')).rejects.toThrow(PdoError);
    });

    it('Works Prepare Return PdoPreparedStatement', async () => {
        const stmt = await pdo.prepare('SELECT 1');
        expect(stmt).toBeInstanceOf(PdoPreparedStatement);
        await stmt.execute();
        await stmt.close();
    });

    it('Works Prepare Fails', async () => {
        await expect(pdo.prepare('SELECT ??')).rejects.toThrow(PdoError);
    });

    it('Works Get Raw Pool Connection', async () => {
        const raw = await pdo.getRawPoolConnection();
        expect(raw.connection).toBeInstanceOf(Database);

        await raw.release();
    });

    it('Works Get Raw Driver Connection', async () => {
        const conn = await pdo.getRawDriverConnection<Connection>();
        expect(conn).toBeInstanceOf(Database);
        conn.defaultSafeIntegers(true);
        const row = conn.prepare('SELECT * FROM users WHERE id = ?').get(1);
        expect(row.id).toEqual(BigInt(1));
        expect(row.name).toBe('Edmund');
        expect(row.gender).toBe('Multigender');
        conn.close();
    });

    it('Works Connection On Create', async () => {
        const pdo = new Pdo(
            pdoData.driver,
            pdoData.config,
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

    it('Works Debug', async () => {
        console.log = jest.fn();
        console.trace = jest.fn();
        const pdo = new Pdo(pdoData.driver, pdoData.config, {}, { [ATTR_DEBUG]: DEBUG_ENABLED });
        await pdo.query('SELECT 1');
        expect(console.log).toHaveBeenCalled();
        await pdo.disconnect();
    });

    it('Works Debug Not Override Verbose', async () => {
        console.log = jest.fn();
        console.trace = jest.fn();
        const queries: any[] = [];
        const pdo = new Pdo(
            pdoData.driver,
            {
                ...pdoData.config,
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

    it('Works Destroy Connection Does not kill connection', async () => {
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
            pdoData.driver,
            pdoData.config,
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
