import { Pdo } from 'lupdo';
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
});
