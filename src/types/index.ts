import * as sqlite from 'better-sqlite3';

export interface SqlitePoolConnection extends sqlite.Database {
    __lupdo_uuid: string;
    __lupdo_killed: boolean;
}

export interface SqliteOptions extends sqlite.Options {
    path: string;
    wal?: boolean;
    walSynchronous?: 'OFF' | 'NORMAL' | 'FULL' | 'EXTRA';
    walMaxSize?: number;
    onWalError?: (err: any) => void | Promise<void>;
}
