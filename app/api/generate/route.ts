import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY non impostata' }, { status: 500 });
    }

    const promptMessages = [
      { role: 'system', content: 'Sei Harid AI, un assistente colloqui in stile Gemini. Fai domande pertinenti al profilo candidato e fornisci feedback leggeri, orientati al career coaching.' },
      ...messages,
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: promptMessages,
        max_tokens: 250,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI error:', errText);
      return NextResponse.json({ error: 'Errore generazione AI' }, { status: 500 });
    }

    const data = await response.json();
    const aiContent = data?.choices?.[0]?.message?.content || 'Scusa, non ho capito. Riprova.';

    return NextResponse.json({ content: aiContent });
  } catch (error) {
    console.error('Errore API generazione:', error);
    return NextResponse.json({ error: 'Errore generazione AI' }, { status: 500 });
  }
}
