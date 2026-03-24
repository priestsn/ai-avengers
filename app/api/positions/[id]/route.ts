import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { title, department, description, requirements } = await request.json();
    const sql = neon(process.env.DATABASE_URL!);
    
    const result = await sql`
      UPDATE positions
      SET title = ${title}, department = ${department}, description = ${description}, requirements = ${JSON.stringify(requirements)}
      WHERE id = ${params.id}
      RETURNING id, title, department, description, requirements
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update position' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`DELETE FROM positions WHERE id = ${params.id}`;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete position' }, { status: 500 });
  }
}
