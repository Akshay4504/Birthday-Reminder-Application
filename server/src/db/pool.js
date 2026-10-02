import sql from 'mssql/msnodesqlv8.js';
import { env } from '../config/env.js';

const connectionString = `Driver={ODBC Driver 17 for SQL Server};Server=${env.DB_HOST || '.'};Database=${env.DB_NAME};Trusted_Connection=yes;Timeout=5;`;

const config = {
  connectionString
};

// We will try connecting, and properly log the status.
const mssqlPool = new sql.ConnectionPool(config);

const poolConnect = mssqlPool.connect()
  .then(() => {
    console.log('✅ Successfully connected to SQL Server!');
    return mssqlPool;
  })
  .catch(err => {
    console.error('❌ Database Connection Error:', err);
    // We MUST throw the error so the app knows it failed, 
    // otherwise the query gets queued forever!
    throw err; 
  });

export const pool = {
  async query(queryString, params = []) {
    await poolConnect;
    let mssqlQuery = queryString;
    const request = mssqlPool.request();
    
    // Replace ? with @p0, @p1, etc. to support mysql2 query format
    let paramIndex = 0;
    mssqlQuery = mssqlQuery.replace(/\?/g, () => {
      const paramName = `param_${paramIndex}`;
      request.input(paramName, params[paramIndex]);
      paramIndex++;
      return `@${paramName}`;
    });

    const isInsert = /^\s*INSERT\s+INTO/i.test(mssqlQuery);
    if (isInsert) {
      mssqlQuery += '; SELECT SCOPE_IDENTITY() AS insertId;';
    }

    try {
      const result = await request.query(mssqlQuery);
      
      if (isInsert) {
        // SQL Server might return the SCOPE_IDENTITY in the last recordset
        const lastRecordset = result.recordsets[result.recordsets.length - 1];
        const insertId = lastRecordset ? lastRecordset[0].insertId : null;
        return [{ insertId, affectedRows: result.rowsAffected[0] }];
      }
      
      const isSelect = /^\s*SELECT/i.test(mssqlQuery);
      if (isSelect) {
        return [result.recordset || []];
      }

      // For UPDATE / DELETE
      return [{ affectedRows: result.rowsAffected[0] }];
    } catch (err) {
      // Map common SQL Server errors to MySQL error codes for compatibility
      if (err.message && err.message.includes('Violation of UNIQUE KEY constraint')) {
        err.code = 'ER_DUP_ENTRY';
      }
      throw err;
    }
  }
};
