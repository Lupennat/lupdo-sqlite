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
const Pdo = require('lupdo');
require('lupdo-sqlite');
// ES6 or Typescrypt
import Pdo from 'lupdo';
import 'ludpo-sqlite';

const pdo = new Pdo('sqlite', { path: ':memory' }, { min: 2, max: 3 });
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

## Kill Connection

Lupdo-sqlite do not support kill query, if you need to perform very slow queries, you should implement [worker threads](https://github.com/WiseLibs/better-sqlite3/blob/2194095aa1183e9c21d28eafadeac0d4d4d42625/docs/threads.md) by yourself.

> **Note**
> you can use better-sqlite3 native api, retrieving a raw connection from the pool with `pdo.getRawPoolConnection()`.
> Do not forget to release rawPoolConnection before stop the job, otherwise the pool will be stuck.
