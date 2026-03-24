import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    // Preferisci Gemini se impostato, altrimenti usa OpenAI come fallback
    if (process.env.GOOGLE_API_KEY) {
      const systemPrompt = 'Sei Harid AI, un assistente colloqui in stile Gemini. Fai domande pertinenti al profilo candidato e fornisci feedback leggeri, orientati al career coaching.';
      const prompt = [systemPrompt, ...messages.map((m: any) => `${m.role === 'assistant' ? 'Harid AI' : 'Candidato'}: ${m.content}`)].join('\n');

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta2/models/gemini-pro:generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GOOGLE_API_KEY}`,
        },
        body: JSON.stringify({
          prompt: {
            text: prompt,
          },
          temperature: 0.75,
          maxOutputTokens: 250,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Gemini API error:', errText);
        throw new Error('Errore Gemini API');
      }

      const data = await response.json();
      const aiContent = data?.candidates?.[0]?.content || 'Scusa, non ho capito. Riprova.';
      return NextResponse.json({ content: aiContent });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Nessuna chiave valida AI impostata (GOOGLE_API_KEY o OPENAI_API_KEY)' }, { status: 500 });
    }

    const promptMessages = [
      { role: 'system', content: 'Sei Harid AI, un assistente colloqui in stile Gemini. Fai domande pertinenti al profilo candidato e fornisci feedback leggeri, orientati al career coaching.' },
      ...messages,
    ];

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error('OpenAI error:', errText);
      throw new Error('Errore generazione AI OpenAI');
    }

    const openaiData = await openaiResponse.json();
    const aiContent = openaiData?.choices?.[0]?.message?.content || 'Scusa, non ho capito. Riprova.';
    return NextResponse.json({ content: aiContent });
  } catch (error) {
    console.error('Errore API generazione:', error);
    return NextResponse.json({ error: 'Errore generazione AI' }, { status: 500 });
  }
}
