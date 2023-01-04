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
        const stmt = await pdo.prepare(
            'INSERT INTO "types" (`int`,`integer`,`tinyint`,`smallint`,`mediumint`,`bigint`,`unsigned_big_int`,`int2`,`int8`,`character`,`varchar`,`varying_character`,`nchar`,`native_character`,`nvarchar`,`text`,`clob`,`blob`,`real`,`double`,`double_precision`,`float`,`numeric`,`decimal`,`boolean`,`date`,`datetime`)' +
                'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        );
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
            '1234.56686767065705',
            '1234.56686767065706',
            1234.12,
            '1234567.1200',
            '12345.67890',
            1,
            1672504892,
            1672505549
        ]);

        await stmt.execute([
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
        ]);

        await stmt.close();

        const query = await pdo.query('SELECT * FROM types LIMIT 2;');
        let row = query.fetchDictionary().get() as { [key: string]: ValidBindings };
        expect(row.int).toBe(10);
        expect(row.integer).toBe(20);
        expect(row.tinyint).toBe(3);
        expect(row.smallint).toBe(4);
        expect(row.mediumint).toBe(5);
        expect(row.bigint).toEqual(BigInt('-9007199254740992'));
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

        row = query.fetchDictionary().get() as { [key: string]: ValidBindings };
        expect(row.int).toBeNull();
        expect(row.integer).toBeNull();
        expect(row.tinyint).toBeNull();
        expect(row.smallint).toBeNull();
        expect(row.mediumint).toBeNull();
        expect(row.bigint).toBeNull();
        expect(row.unsigned_big_int).toBeNull();
        expect(row.int2).toBeNull();
        expect(row.int8).toBeNull();
        expect(row.character).toBeNull();
        expect(row.varchar).toBeNull();
        expect(row.varying_character).toBeNull();
        expect(row.nchar).toBeNull();
        expect(row.native_character).toBeNull();
        expect(row.nvarchar).toBeNull();
        expect(row.text).toBeNull();
        expect(row.clob).toBeNull();
        expect(row.blob).toBeNull();
        expect(row.real).toBeNull();
        expect(row.double).toBeNull();
        expect(row.double_precision).toBeNull();
        expect(row.float).toBeNull();
        expect(row.numeric).toBeNull();
        expect(row.decimal).toBeNull();
        expect(row.boolean).toBeNull();
        expect(row.date).toBeNull();
        expect(row.datetime).toBeNull();

        await pdo.disconnect();
    });
});
