import { Pdo } from 'lupdo';
import { ValidBindings } from 'lupdo/dist/typings/types/pdo-prepared-statement';
import { pdoData } from './fixtures/config';

describe('Sqlite BigInt Cast', () => {
    it('Works Cast', async () => {
        const pdo = new Pdo(pdoData.driver, pdoData.config);

        let stmt = await pdo.query("SELECT CAST('9007199254740992' as SIGNED INTEGER)");
        expect(stmt.fetchColumn(0).get()).toEqual(BigInt('9007199254740992'));

        stmt = await pdo.query("SELECT CAST('-9007199254740992' as SIGNED INTEGER)");
        expect(stmt.fetchColumn(0).get()).toEqual(BigInt('-9007199254740992'));

        stmt = await pdo.query("SELECT CAST('9007199254740991' as SIGNED INTEGER)");
        expect(stmt.fetchColumn(0).get()).toEqual(9007199254740991);

        stmt = await pdo.query("SELECT CAST('-9007199254740991' as SIGNED INTEGER)");
        expect(stmt.fetchColumn(0).get()).toEqual(-9007199254740991);

        await pdo.disconnect();
    });

    it('Works All Columns Types', async () => {
        const pdo = new Pdo(pdoData.driver, pdoData.config);
        const stmt = await pdo.query('SELECT * FROM types;');
        const row = stmt.fetchDictionary().get() as { [key: string]: ValidBindings };
        expect(row.int).toBe(10);
        expect(row.integer).toBe(20);
        expect(row.tinyint).toBe(3);
        expect(row.smallint).toBe(4);
        expect(row.mediumint).toBe(5);
        expect(row.bigint).toEqual(BigInt('9007199254740992'));
        expect(row.unsigned_big_int).toEqual(BigInt('9007199254740993'));
        expect(row.int2).toBe(2);
        expect(row.int8).toBe(4);
        expect(row.character).toBe('character');
        expect(row.varchar).toBe('varchar');
        expect(row.varying_character).toBe('varying_character');
        expect(row.nchar).toBe('nchar');
        expect(row.native_character).toBe('native_character');
        expect(row.nvarchar).toBe('nvarchar');
        expect(row.text).toBe('text');
        expect(row.clob).toBe('clob');
        expect(row.blob).toEqual(Buffer.from('blob as text'));
        expect(row.real).toBe('900719925474099.1');
        expect(row.double).toBe('1234.566867670657');
        expect(row.double_precision).toBe('1234.566867670657');
        expect(row.float).toBe('1234.12');
        expect(row.numeric).toBe('1234567.12');
        expect(row.decimal).toBe('12345.6789');
        expect(row.boolean).toBe(1);
        expect(row.date).toBe(1672504892);
        expect(row.datetime).toBe(1672505549);

        await pdo.disconnect();
    });
});
