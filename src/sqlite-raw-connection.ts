import { Statement } from 'better-sqlite3';
import {
  BaseTypedBinding,
  Params,
  PdoAffectingData,
  PdoColumnData,
  PdoColumnValue,
  PdoRawConnection,
  PdoRowData,
  ValidBindingsSingle,
} from 'lupdo';

import { SqlitePoolConnection } from './types';

export class SqliteRawConnection extends PdoRawConnection {
  protected async doBeginTransaction(
    connection: SqlitePoolConnection,
  ): Promise<void> {
    await connection.prepare('BEGIN').run();
  }

  protected async doCommit(connection: SqlitePoolConnection): Promise<void> {
    await connection.prepare('COMMIT').run();
  }

  protected async doRollback(connection: SqlitePoolConnection): Promise<void> {
    await connection.prepare('ROLLBACK').run();
  }

  protected async getStatement(
    sql: string,
    connection: SqlitePoolConnection,
  ): Promise<Statement> {
    return connection.prepare(sql);
  }

  protected async doExec(
    connection: SqlitePoolConnection,
    sql: string,
  ): Promise<PdoAffectingData> {
    // better-sqlite3 db.exec does not support return
    // it's impossible to retrieve affecting data
    return (await this.doQuery(connection, sql))[0];
  }

  protected async executeStatement(
    statement: Statement,
    bindings: Params,
  ): Promise<[string, PdoAffectingData, PdoRowData[], PdoColumnData[]]> {
    return [statement.source, ...(await this.runStatment(statement, bindings))];
  }

  private async runStatment(
    statement: Statement,
    bindings: Params,
  ): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]> {
    statement.safeIntegers(true);
    const info = await statement.run(bindings);
    const columns = (statement.reader ? statement.columns() : []).map(
      (field) => {
        return {
          name: field.name,
          column: field.column,
          table: field.table ?? '',
          database: field.database,
          type: field.type,
        };
      },
    );

    return [
      statement.reader
        ? {}
        : {
            lastInsertRowid: this.convertToSafeNumber(info.lastInsertRowid),
            affectedRows: info.changes,
          },
      statement.reader
        ? (statement.raw().all(bindings) as PdoRowData[]).map(
            (row: PdoColumnValue[]) => {
              return row.map((value, index) => {
                const column = columns[index];
                if (
                  column != null &&
                  (column.type === null || this.shouldBeNumber(column.type))
                ) {
                  return typeof value === 'bigint' || typeof value === 'number'
                    ? this.convertToSafeNumber(value)
                    : value;
                }
                return typeof value === 'bigint' || typeof value === 'number'
                  ? value.toString()
                  : value;
              });
            },
          )
        : [],
      columns,
    ];
  }

  protected async closeStatement(): Promise<void> {
    return void 0;
  }

  protected async doQuery(
    connection: SqlitePoolConnection,
    sql: string,
  ): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]> {
    const statement = await this.getStatement(sql, connection);
    return await this.runStatment(statement, []);
  }

  protected adaptBindValue(value: ValidBindingsSingle): ValidBindingsSingle {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'boolean') {
      return Number(value);
    }

    if (value instanceof BaseTypedBinding) {
      return this.adaptBindValue(value.value);
    }

    return value;
  }

  protected shouldBeNumber(value: string): boolean {
    return [
      'DATE',
      'DATETIME',
      'BOOLEAN',
      'INT',
      'INTEGER',
      'TINYINT',
      'SMALLINT',
      'MEDIUMINT',
      'BIGINT',
      'UNSIGNED BIG INT',
      'INT2',
      'INT8',
    ].includes(value.toUpperCase());
  }

  protected convertToSafeNumber(
    valueToCheck: number | bigint,
  ): string | number | bigint {
    if (typeof valueToCheck !== 'bigint' && valueToCheck % 1 !== 0) {
      return valueToCheck.toString();
    }
    const stringValue = valueToCheck.toString();
    try {
      return this.converToBigIntOrNumber(stringValue);
    } catch (error) {
      return this.converToBigIntOrNumber(valueToCheck);
    }
  }

  protected converToBigIntOrNumber(
    value: string | number | bigint,
  ): number | bigint {
    const bigInt = BigInt(value);
    if (bigInt > Number.MAX_SAFE_INTEGER || bigInt < Number.MIN_SAFE_INTEGER) {
      return bigInt;
    }
    return Number(value);
  }
}

export default SqliteRawConnection;
