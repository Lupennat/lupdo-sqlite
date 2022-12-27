'use strict';

import { Database } from 'better-sqlite3';
import { PdoConnection } from 'lupdo';

class SqliteConnection extends PdoConnection {
    constructor(public readonly connection: Database) {
        super();
    }

    async query(sql: string): Promise<void> {
        await this.connection.pragma(sql);
    }
}

export default SqliteConnection;
