import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`SELECT * FROM positions ORDER BY created_at DESC`;
    return NextResponse.json(result);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, department, description, requirements } = await request.json();
    const sql = neon(process.env.DATABASE_URL!);
    
    const result = await sql`
      INSERT INTO positions (title, department, description, requirements, created_at)
      VALUES (${title}, ${department}, ${description}, ${JSON.stringify(requirements)}, NOW())
      RETURNING id, title, department, description, requirements
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create position' }, { status: 500 });
  }
}
