import { Pdo, PdoI } from 'lupdo';
import { drivers, tests } from './fixtures/config';

describe('Sql Prepared Statement', () => {
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

    it.each(tests)('Works $driver Statement Prepared Statement Execute Without Array', async driver => {
        const stmt = await pdos[driver].prepare('SELECT * FROM users LIMIT 3;');
        const stmt2 = await pdos[driver].prepare('SELECT * FROM users LIMIT 5;');
        await stmt.execute();
        await stmt2.execute();

        expect(stmt.fetchArray().all().length).toBe(3);
        expect(stmt.fetchArray().all().length).toBe(0);

        expect(stmt2.fetchArray().all().length).toBe(5);
        expect(stmt2.fetchArray().all().length).toBe(0);

        await stmt.close();
        await stmt2.close();
    });

    it.each(tests)('Works $driver Statement Prepared Statement Bind Numeric Value', async driver => {
        const stmt = await pdos[driver].prepare('SELECT * FROM users limit ?;');
        stmt.bindValue(1, 3);
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(3);
        expect(stmt.fetchArray().all().length).toBe(0);
        stmt.bindValue(1, 5);
        await stmt.execute();

        expect(stmt.fetchArray().all().length).toBe(5);
        expect(stmt.fetchArray().all().length).toBe(0);

        await stmt.close();
    });

    it.each(tests)('Works $driver Statement Prepared Statement Bind Key Value', async driver => {
        const stmt = await pdos[driver].prepare('SELECT * FROM users limit :limit;');
        stmt.bindValue('limit', 3);
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(3);
        expect(stmt.fetchArray().all().length).toBe(0);
        stmt.bindValue('limit', 5);
        await stmt.execute();

        expect(stmt.fetchArray().all().length).toBe(5);
        expect(stmt.fetchArray().all().length).toBe(0);

        await stmt.close();
    });

    it.each(tests)('Works $driver Statement Bind Value Fails With Mixed Values', async driver => {
        let stmt = await pdos[driver].prepare('SELECT * FROM users where gender = ? LIMIT :limit;');
        stmt.bindValue(1, 'Cisgender male');
        expect(() => {
            stmt.bindValue('limit', 3);
        }).toThrow('Mixed Params Numeric and Keyed are forbidden.');

        await stmt.close();

        stmt = await pdos[driver].prepare('SELECT * FROM users where gender = ? LIMIT :limit;');
        stmt.bindValue('limit', 3);
        expect(() => {
            stmt.bindValue(1, 'Cisgender male');
        }).toThrow('Mixed Params Numeric and Keyed are forbidden.');

        await stmt.close();
    });

    it.each(tests)('Works $driver Statement Execute With Numeric Value', async driver => {
        const stmt = await pdos[driver].prepare('SELECT * FROM users limit ?;');
        await stmt.execute([3]);
        expect(stmt.fetchArray().all().length).toBe(3);
        expect(stmt.fetchArray().all().length).toBe(0);
        await stmt.execute([5]);

        expect(stmt.fetchArray().all().length).toBe(5);
        expect(stmt.fetchArray().all().length).toBe(0);

        await stmt.close();
    });

    it.each(tests)('Works $driver Statement Execute With Key Value', async driver => {
        const stmt = await pdos[driver].prepare('SELECT * FROM users limit :limit;');

        await stmt.execute({ limit: 3 });
        expect(stmt.fetchArray().all().length).toBe(3);
        expect(stmt.fetchArray().all().length).toBe(0);
        await stmt.execute({ limit: 5 });

        expect(stmt.fetchArray().all().length).toBe(5);
        expect(stmt.fetchArray().all().length).toBe(0);

        await stmt.close();
    });

    it.each(tests)('Works $driver Statement Bind Number', async driver => {
        let stmt = await pdos[driver].prepare('SELECT * FROM users limit :limit;');
        stmt.bindValue('limit', BigInt(3));
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(3);
        await stmt.close();
        stmt = await pdos[driver].prepare('SELECT ?;');
        await stmt.execute([1]);
        expect(stmt.fetchColumn(0).get()).toBe(1);
        await stmt.close();
    });

    it.each(tests)('Works $driver Statement Bind BigInter', async driver => {
        let stmt = await pdos[driver].prepare('SELECT * FROM users limit :limit;');
        stmt.bindValue('limit', BigInt(3));
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(3);
        await stmt.close();
        stmt = await pdos[driver].prepare('SELECT ?;');
        await stmt.execute([BigInt(9007199254740994)]);
        expect(stmt.fetchColumn(0).get()).toBe(BigInt(9007199254740994));
        await stmt.close();
    });

    it.each(tests)('Works $driver Statement Bind Date', async driver => {
        let stmt = await pdos[driver].prepare(
            "SELECT * FROM companies WHERE CAST(strftime('%s', opened) as INTEGER) > CAST(strftime('%s', ?) as INTEGER);"
        );
        const date = new Date('2014-01-01');
        stmt.bindValue(1, date);
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(10);
        await stmt.close();
        stmt = await pdos[driver].prepare("SELECT CAST(strftime('%s', ?) as INTEGER);");
        await stmt.execute([date]);

        expect(new Date((stmt.fetchColumn(0).get() as number) * 1000)).toEqual(date);
        await stmt.close();
    });

    it.each(tests)('Works $driver Statement Bind Boolean', async driver => {
        let stmt = await pdos[driver].prepare('SELECT * FROM companies where active = ?;');
        stmt.bindValue(1, false);
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(5);
        await stmt.close();
        stmt = await pdos[driver].prepare('SELECT ?;');
        await stmt.execute([true]);
        expect(stmt.fetchColumn(0).get()).toEqual(1);
        await stmt.close();
    });

    it.each(tests)('Works $driver Statement Bind String', async driver => {
        let stmt = await pdos[driver].prepare('select `id` from users where `name` = ?;');
        stmt.bindValue(1, 'Edmund');
        await stmt.execute();
        expect(stmt.fetchArray().all().length).toBe(1);
        await stmt.close();
        stmt = await pdos[driver].prepare('SELECT LOWER(?);');
        await stmt.execute(['Edmund']);
        expect(stmt.fetchColumn(0).get()).toEqual('edmund');
        await stmt.close();
    });

    it.each(tests)('Works $driver Statement Buffer', async driver => {
        let stmt = await pdos[driver].prepare('select ?');
        const buffer = Buffer.from('Edmund');
        stmt.bindValue(1, buffer);
        await stmt.execute();
        expect(stmt.fetchColumn<Buffer>(0).get()?.toString()).toBe('Edmund');
        await stmt.close();
        const newBuffer = Buffer.from('buffer as blob on database');
        stmt = await pdos[driver].prepare('INSERT INTO companies (name, opened, active, binary) VALUES(?,?,?,?);');
        await stmt.execute(['Test', '2000-12-26T00:00:00.000Z', 1, newBuffer]);
        const lastId = stmt.lastInsertId() as number;
        await stmt.close();
        stmt = await pdos[driver].prepare('SELECT binary FROM companies WHERE id = ?;');
        await stmt.execute([lastId]);
        expect(stmt.fetchColumn<Buffer>(0).get()?.toString()).toBe('buffer as blob on database');
        await stmt.close();
        stmt = await pdos[driver].prepare('SELECT id FROM companies WHERE binary = ?;');
        await stmt.execute([Buffer.from('buffer as blob on database')]);
        expect(stmt.fetchColumn<number>(0).get()).toBe(lastId);
        await stmt.close();
        expect(await pdos[driver].exec('DELETE FROM companies WHERE (id = ' + lastId + ');')).toBe(1);
    });
});
