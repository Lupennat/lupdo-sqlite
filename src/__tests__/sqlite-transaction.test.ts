import { Pdo, PdoI, PdoStatement, PdoTransaction, PdoTransactionPreparedStatement } from 'lupdo';
import { drivers, tests } from './fixtures/config';

describe('Sqlite Transactions', () => {
    const pdos: { [key: string]: PdoI } = {};

    beforeAll(() => {
        for (const driver in drivers) {
            pdos[driver] = new Pdo(driver, drivers[driver]);
        }
    });

    afterAll(async () => {
        for (const driver in pdos) {
            await pdos[driver].disconnect();
        }
    });

    afterEach(() => {
        Pdo.setLogger(() => {});
    });

    it.each(tests)('Works $driver Transaction Rollback && Commit', async driver => {
        const countBefore = await pdos[driver].query('SELECT count(*) as total FROM users');
        const counter = countBefore.fetchColumn<number>(0).get() as number;
        let trx = await pdos[driver].beginTransaction();
        expect(trx).toBeInstanceOf(PdoTransaction);
        let executed = await trx.exec("INSERT INTO users (name, gender) VALUES ('Claudio', 'All');");
        expect(executed).toBe(1);
        await trx.rollback();
        let countAfter = await pdos[driver].query('SELECT count(*) as total FROM users');
        expect(countAfter.fetchColumn<number>(0).get()).toBe(counter);

        trx = await pdos[driver].beginTransaction();
        expect(trx).toBeInstanceOf(PdoTransaction);
        executed = await trx.exec("INSERT INTO users (name, gender) VALUES ('Claudio', 'All');");
        expect(executed).toBe(1);
        await trx.commit();
        countAfter = await pdos[driver].query('SELECT count(*) as total FROM users');
        expect(countAfter.fetchColumn<number>(0).get()).toBe(counter + 1);

        const stmt = await pdos[driver].query("SELECT id FROM users where name = 'Claudio';");
        const id = stmt.fetchColumn<number>(0).get() as number;
        expect(await pdos[driver].exec('DELETE FROM users WHERE (id = ' + id + ');')).toBe(1);
    });

    it.each(tests)('Works $driver Transaction Exec Return Number', async driver => {
        const trx = await pdos[driver].beginTransaction();
        const res = await trx.exec('SELECT 1');
        expect(typeof res === 'number').toBeTruthy();
        expect(res).toEqual(0);
        await trx.rollback();
    });

    it.each(tests)('Works $driver Transaction Query Return PdoStatement', async driver => {
        const trx = await pdos[driver].beginTransaction();
        const stmt = await trx.query('SELECT 1');
        expect(stmt).toBeInstanceOf(PdoStatement);
        await trx.rollback();
    });

    it.each(tests)('Works $driver Transaction Prepare Return PdoTransactionPreparedStatement', async driver => {
        const trx = await pdos[driver].beginTransaction();
        const stmt = await trx.prepare('SELECT 1');
        expect(stmt).toBeInstanceOf(PdoTransactionPreparedStatement);
        await stmt.execute();
        await trx.rollback();
    });
});
