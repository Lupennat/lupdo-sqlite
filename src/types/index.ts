import Database, * as sqlite from 'better-sqlite3';

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

export interface SqliteAggregateOptions {
  varargs?: boolean | undefined;
  deterministic?: boolean | undefined;
  safeIntegers?: boolean | undefined;
  directOnly?: boolean | undefined;
  start?: any | (() => any);
  step: (total: any, next: any) => any | void;
  inverse?: ((total: any, dropped: any) => any) | undefined;
  result?: ((total: any) => any) | undefined;
}
export interface SqliteFunctionOptions extends Database.RegistrationOptions {
  execute: (...params: any[]) => any;
}
