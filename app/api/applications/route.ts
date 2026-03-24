import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`SELECT * FROM applications ORDER BY created_at DESC`;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { candidateName, positionId, questionnaire, score, report, status } = await request.json();
    
    const result = await sql`
      INSERT INTO applications (candidate_name, position_id, questionnaire, score, report, status, created_at)
      VALUES (${candidateName}, ${positionId}, ${JSON.stringify(questionnaire)}, ${score}, ${report}, ${status || 'pending'}, NOW())
      RETURNING id, candidate_name as "candidateName", position_id as "positionId", questionnaire, score, report, status, created_at as "createdAt"
    `;

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
