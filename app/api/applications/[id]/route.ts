import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const sql = neon(process.env.DATABASE_URL!);
    
    const result = await sql`
      UPDATE applications
      SET status = ${status}
      WHERE id = ${params.id}
      RETURNING id, candidate_name as candidateName, position_id as positionId, questionnaire, score, report, status, created_at as createdAt
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
