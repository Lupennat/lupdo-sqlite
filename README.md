<p align="center">
	<a href="https://www.npmjs.com/package/lupdo-sqlite" target="__blank">
        <img src="https://img.shields.io/npm/v/lupdo-sqlite?color=0476bc&label=" alt="NPM version">
    </a>
	<a href="https://www.npmjs.com/package/lupdo-sqlite" target="__blank">
        <img alt="NPM Downloads" src="https://img.shields.io/npm/dm/lupdo-sqlite?color=3890aa&label=">
    </a>
    <a href="https://app.codecov.io/github/Lupennat/lupdo-sqlite" target="__blank">
        <img src="https://codecov.io/github/Lupennat/lupdo-sqlite/branch/main/graph/badge.svg?token=19C8E6QTCE"/>
    </a>
    <a href="https://snyk.io/test/github/lupennat/lupdo-sqlite" target="__blank">
        <img src="https://snyk.io/test/github/lupennat/lupdo-sqlite/badge.svg">
    </a>
</p>

# Lupdo-sqlite

[Lupdo](https://www.npmjs.com/package/lupdo) Driver For Sqlite.

## Supported Databases

-   [sqlite/sqlite3](https://www.sqlite.org/index.html)

## Third Party Library

Lupdo-sqlite, under the hood, uses stable and performant npm packages:

-   [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

## Usage

Base Example

```js
const { createSqlitePdo } = require('lupdo-sqlite');
// ES6 or Typescrypt
import { createSqlitePdo } from 'ludpo-sqlite';

const pdo = createSqlitePdo({ path: ':memory' }, { min: 2, max: 3 });
const run = async () => {
    const statement = await pdo.query('SELECT 2');
    const res = statement.fetchArray().all();
    console.log(res);
    await pdo.disconnect();
};

run();
```

## Driver Options

[https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#new-databasepath-options](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#new-databasepath-options)

new required option added:

-   path: string

new optional option added

-   [wal: boolean](https://www.sqlite.org/wal.html) [default `false`]
-   [synchronous: string](https://sqlite.org/pragma.html#pragma_synchronous) [default `NORMAL` works only when WAL enabled]
-   maxSize: number [default undefined] (MB)
-   onWalError: (err) => void [default undefined]

When WAL is enabled and `maxSize` is defined every 5 seconds lupdo-sqlite will check if WAL file is bigger than maxSize, if size is greater than maxSize [wal_checkpoint(TRUNCATE)](https://www.sqlite.org/pragma.html#pragma_wal_checkpoint) is called.\
When WAL watcher get an error it will call your custom `onWalError` callback with the original error.\
Sqlite only creates the WAL file when it is needed, which is why it may not exist, here is an example:

```ts
const pdo = createSqlitePdo(
    {
        path: 'sqlitefile.db',
        wal: true,
        maxSize: 100,
        onWalError: (err: any) => {
            if (err.code !== 'ENOENT') {
                // log the error on your application
            }
        }
    },
    { min: 2, max: 3 }
);
```

## Better Sqlite Overrides

By default Ludpo-sqlite enable `db.defaultSafeIntegers(true)` and `statement.safeIntegers(true)`.
[https://github.com/WiseLibs/better-sqlite3/blob/2194095aa1183e9c21d28eafadeac0d4d4d42625/docs/integer.md#getting-bigints-from-the-database](https://github.com/WiseLibs/better-sqlite3/blob/2194095aa1183e9c21d28eafadeac0d4d4d42625/docs/integer.md#getting-bigints-from-the-database)

Internally lupdo-sqlite convert bigint to normal number if precision will be preserved.

> **Note**
> Custom Aggregate and Function must be adapted as required if using numbers.

## Parameters Binding

Lupdo-sqlite ignore type definition of `TypeBinding` parameter.\
Lupdo-sqlite does not support array of parameters.

## Not Integer Numbers

> **Warning**
> All non-integer numbers are returned as strings, no precision is guaranteed, you can choose which cast to apply in your application.

## Kill Connection

Lupdo-sqlite do not support kill query, if you need to perform very slow queries, you should implement [worker threads](https://github.com/WiseLibs/better-sqlite3/blob/2194095aa1183e9c21d28eafadeac0d4d4d42625/docs/threads.md) by yourself.

> **Note**
> you can use better-sqlite3 native api, retrieving a raw connection from the pool with `pdo.getRawPoolConnection()`.
> Do not forget to release rawPoolConnection before stop the job, otherwise the pool will be stuck.

## SqliteDriver Create Function & Aggregate

SqliteDriver expose two static Method in order to register custom [aggregates](https://sqlite.org/lang_aggfunc.html) and [functions](https://sqlite.org/lang_corefunc.html).

Here You can find more details on [aggregate](https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md#aggregatename-options---this) and [functions](https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md#functionname-options-function---this) Options.

> **Note**
> The `SqliteDriver.createFunction(name, options)` differs from the original `better-sqlite3.function(name, [options], function)`, it accepts only a name and a config, config must contains `execute` function.

```ts
const { createSqlitePdo, SqliteDriver } = require('lupdo-sqlite');
// ES6 or Typescrypt
import { createSqlitePdo, SqliteDriver } from 'ludpo-sqlite';

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

const pdo = createSqlitePdo({ path: './test.db' });

await pdo.query('SELECT max_len(name) FROM companies;');
await pdo.query('SELECT add2(name, gender) FROM users;');
```
