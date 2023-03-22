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

import { unlink, writeFile } from 'node:fs/promises';
import { createSqlitePdo } from '..';
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

    it('Works Wal', async () => {
        let pdo = new Pdo(pdoData.driver, { ...pdoData.config, path: ':memory:', wal: true });
        let stmt = await pdo.query('pragma journal_mode');
        expect(stmt.fetchColumn(0).all()).toEqual(['memory']);
        await pdo.disconnect();
        let path = pdoData.config.path + 'nowal';
        await writeFile(path, '');
        pdo = new Pdo(pdoData.driver, { ...pdoData.config, path });
        stmt = await pdo.query('pragma journal_mode');
        expect(stmt.fetchColumn(0).all()).toEqual(['delete']);
        await pdo.disconnect();
        await unlink(path);
        path = pdoData.config.path + 'withwal';
        await writeFile(path, '');
        pdo = new Pdo(pdoData.driver, { ...pdoData.config, path, wal: true });
        stmt = await pdo.query('pragma journal_mode');
        expect(stmt.fetchColumn(0).all()).toEqual(['wal']);
        await pdo.disconnect();
        await unlink(path);
    });

    it('Works Synchronous Option Only When Wal Enabled', async () => {
        let pdo = new Pdo(pdoData.driver, pdoData.config);
        let stmt = await pdo.query('PRAGMA synchronous');
        expect(stmt.fetchColumn(0).all()).toEqual([2]);
        await pdo.disconnect();
        pdo = new Pdo(pdoData.driver, { ...pdoData.config, walSynchronous: 'NORMAL' });
        stmt = await pdo.query('PRAGMA synchronous');
        expect(stmt.fetchColumn(0).all()).toEqual([2]);
        await pdo.disconnect();
        let path = pdoData.config.path + 'withwalnormalsync';
        await writeFile(path, '');
        pdo = new Pdo(pdoData.driver, { ...pdoData.config, path, wal: true });
        stmt = await pdo.query('PRAGMA synchronous');
        expect(stmt.fetchColumn(0).all()).toEqual([1]);
        await pdo.disconnect();
        await unlink(path);
        path = pdoData.config.path + 'withwalfullsync';
        await writeFile(path, '');
        pdo = new Pdo(pdoData.driver, { ...pdoData.config, path, wal: true, walSynchronous: 'FULL' });
        stmt = await pdo.query('PRAGMA synchronous');
        expect(stmt.fetchColumn(0).all()).toEqual([2]);
        await pdo.disconnect();
        await unlink(path);
    });

    it('Works Wal Max Size', async () => {
        const messages: { level: string; message: string }[] = [];
        Pdo.setLogger(
            jest.fn((level: string, message: string) => {
                messages.push({ level, message });
            })
        );
        let path = pdoData.config.path + 'walnosize';
        await writeFile(path, '');
        let pdo = new Pdo(pdoData.driver, { ...pdoData.config, path, wal: true });
        await pdo.query('select 1');
        expect(messages.length).toBe(0);
        await pdo.disconnect();
        await unlink(path);

        path = pdoData.config.path + 'walwalMaxSize';
        await writeFile(path, '');
        pdo = new Pdo(pdoData.driver, { ...pdoData.config, path, wal: true, walMaxSize: 0.01 });

        await pdo.exec(`CREATE TABLE "wal_check" (
            "int" INT NULL,
            "integer" INTEGER NULL,
            "tinyint" TINYINT NULL,
            "smallint" SMALLINT NULL,
            "mediumint" MEDIUMINT NULL,
            "bigint" BIGINT NULL,
            "unsigned_big_int" UNSIGNED BIG INT NULL,
            "int2" INT2 NULL,
            "int8" INT8 NULL,
            "character" CHARACTER(20) NULL,
            "varchar" VARCHAR(255) NULL,
            "varying_character" VARYING CHARACTER(255) NULL,
            "nchar" NCHAR(55) NULL,
            "native_character" NATIVE CHARACTER(70) NULL,
            "nvarchar" NVARCHAR(100) NULL,
            "text" TEXT NULL,
            "clob" CLOB NULL,
            "blob" BLOB NULL,
            "real" REAL NULL,
            "double" DOUBLE NULL,
            "double_precision" DOUBLE PRECISION NULL,
            "float" FLOAT NULL,
            "numeric" NUMERIC NULL,
            "decimal" DECIMAL(10,5) NULL,
            "boolean" BOOLEAN NULL,
            "date" DATE NULL,
            "datetime" DATETIME NULL
        )`);
        const trx = await pdo.beginTransaction();
        const stmt = await trx.prepare(
            'INSERT INTO "wal_check" (`int`,`integer`,`tinyint`,`smallint`,`mediumint`,`bigint`,`unsigned_big_int`,`int2`,`int8`,`character`,`varchar`,`varying_character`,`nchar`,`native_character`,`nvarchar`,`text`,`clob`,`blob`,`real`,`double`,`double_precision`,`float`,`numeric`,`decimal`,`boolean`,`date`,`datetime`)' +
                'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        );
        for (let x = 0; x < 100; x++) {
            await stmt.execute([
                10,
                20,
                3,
                4,
                5,
                BigInt('-9007199254740992'),
                BigInt('9007199254740993'),
                2,
                4,
                'character',
                'varchar',
                'varying_character',
                'nchar',
                'native_character',
                'nvarchar',
                'text',
                'clob',
                Buffer.from('blob as text'),
                '900719925474099.1267',
                1234,
                '1234.56686767065706',
                1234.0,
                '1234567.1200',
                '12345.67890',
                1,
                1672504892,
                1672505549
            ]);
        }
        await trx.commit();
        await sleep(6000);

        expect(messages.length).toBe(2);
        expect(messages[1].level).toBe('warning');
        expect(messages[1].message.startsWith('WAL checkpoint TRUNCATE called, file size')).toBeTruthy();
        const size = messages[1].message
            .replace('WAL checkpoint TRUNCATE called, file size ', '')
            .replace('mb is greater than 0.01mb.', '');
        expect(Number(size) > 0.01).toBeTruthy();
        await pdo.disconnect();
        await unlink(path);
        Pdo.setLogger(() => {});
    }, 10000);

    it('Works Wal Always False When Memory Database', async () => {
        const messages: { level: string; message: string }[] = [];
        Pdo.setLogger(
            jest.fn((level: string, message: string) => {
                messages.push({ level, message });
            })
        );
        const pdo = new Pdo(pdoData.driver, { ...pdoData.config, path: ':memory:', wal: true, walMaxSize: 0.01 });
        const stmt = await pdo.query('select 1');
        expect(stmt.fetchColumn(0).all()).toEqual([1]);
        expect(messages.length).toBe(0);
        Pdo.setLogger(() => {});
        await pdo.disconnect();
    });

    it('Works Wal On Error', async () => {
        const path = pdoData.config.path + 'walonerror';
        await writeFile(path, '');
        const errCb = jest.fn(err => {
            expect(err.code).toBe('ENOENT');
        });

        const pdo = new Pdo(pdoData.driver, { ...pdoData.config, path, wal: true, walMaxSize: 100, onWalError: errCb });
        await pdo.exec(
            'CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT,"name" TEXT NOT NULL,"gender" TEXT NOT NULL);'
        );
        await unlink(path + '-wal');
        await sleep(6000);
        expect(errCb).toBeCalledTimes(1);
        await pdo.disconnect();
        await unlink(path);
        Pdo.setLogger(() => {});
    }, 10000);

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

    it('Work createSqlitePdo', async () => {
        const pdo = createSqlitePdo(pdoData.config);
        expect(pdo).toBeInstanceOf(Pdo);
        await pdo.disconnect();
    });

    it('Work Get Version', async () => {
        const pdo = createSqlitePdo(pdoData.config);
        expect((await pdo.getVersion()).startsWith('3')).toBeTruthy();
    });

    it('Works Pdo Connection Version', async () => {
        const pdo = createSqlitePdo(pdoData.config, {
            created: (uuid, connection) => {
                expect(connection.version.startsWith('3')).toBeTruthy();
            }
        });
        await pdo.query('SELECT 1');
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
