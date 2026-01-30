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

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Basic security check: prevent certain dangerous operations
    const upperQuery = query.trim().toUpperCase();
    if (
      upperQuery.includes('DROP DATABASE') ||
      upperQuery.includes('DELETE FROM') ||
      upperQuery.includes('TRUNCATE')
    ) {
      return NextResponse.json(
        { error: 'Dangerous operations are not allowed' },
        { status: 403 }
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(query);
      
      return NextResponse.json({
        success: true,
        rowCount: result.rowCount,
        rows: result.rows,
        fields: result.fields?.map(f => ({ name: f.name, dataTypeID: f.dataTypeID })) || [],
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
