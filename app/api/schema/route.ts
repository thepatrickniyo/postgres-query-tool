import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a connection pool using environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME,
});

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface TableInfo {
  table_schema: string;
  table_name: string;
  columns: TableColumn[];
}

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();
    try {
      // Get all tables with their schemas
      const tablesQuery = `
        SELECT 
          table_schema,
          table_name
        FROM information_schema.tables
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
          AND table_type = 'BASE TABLE'
        ORDER BY table_schema, table_name;
      `;

      const tablesResult = await client.query(tablesQuery);
      const tables: TableInfo[] = [];

      // For each table, get its columns
      for (const table of tablesResult.rows) {
        const columnsQuery = `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position;
        `;

        const columnsResult = await client.query(columnsQuery, [
          table.table_schema,
          table.table_name,
        ]);

        tables.push({
          table_schema: table.table_schema,
          table_name: table.table_name,
          columns: columnsResult.rows.map((col) => ({
            column_name: col.column_name,
            data_type: col.data_type,
            is_nullable: col.is_nullable,
            column_default: col.column_default,
          })),
        });
      }

      return NextResponse.json({
        success: true,
        tables,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: 400 }
    );
  }
}
