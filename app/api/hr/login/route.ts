import { NextResponse } from 'next/server';

// Server-side HR auth check. Credentials come from env (never shipped to client).
export async function POST(request: Request) {
  const expectedEmail = process.env.HR_EMAIL;
  const expectedPassword = process.env.HR_PASSWORD;

  if (!expectedEmail || !expectedPassword) {
    return NextResponse.json({ error: 'HR auth not configured' }, { status: 503 });
  }

  try {
    const { email, password } = await request.json();
    if (email === expectedEmail && password === expectedPassword) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: 'Credenziali HR non valide.' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
