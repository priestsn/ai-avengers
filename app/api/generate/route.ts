import { NextResponse } from 'next/server';

// Scripted, deterministic demo interviewer — used when no AI API key is set,
// so the platform is fully demoable out of the box (e.g. on a recruiter's machine).
const DEMO_SCRIPT = [
  'Ciao, sono Harid AI. Prima di iniziare, raccontami brevemente di te e del percorso che ti ha portato qui.',
  'Interessante. Parliamo della posizione scelta: qual è il motivo principale per cui ti interessa proprio questo ruolo?',
  'Ottimo. Descrivimi un progetto concreto su cui hai lavorato e che ritieni rappresentativo delle tue capacità.',
  'Come gestisci il feedback negativo o un conflitto all’interno di un team? Fammi un esempio reale.',
  'Ultima domanda: c’è qualcosa che avresti voluto fare diversamente nel tuo percorso? Colloquio terminato — grazie per il colloquio!',
];

function demoReply(messages: any[]): string {
  const userTurns = messages.filter((m) => m.role === 'user').length;
  const idx = Math.min(userTurns, DEMO_SCRIPT.length - 1);
  return DEMO_SCRIPT[idx];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    // --- Live AI path (requires a configured key) ---
    if (process.env.GOOGLE_API_KEY) {
      const systemPrompt =
        'Sei Harid AI, un assistente colloqui in stile Gemini. Fai domande pertinenti al profilo candidato e fornisci feedback leggeri, orientati al career coaching.';
      const prompt = [
        systemPrompt,
        ...messages.map((m: any) => `${m.role === 'assistant' ? 'Harid AI' : 'Candidato'}: ${m.content}`),
      ].join('\n');

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta2/models/gemini-pro:generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GOOGLE_API_KEY}`,
          },
          body: JSON.stringify({
            prompt: { text: prompt },
            temperature: 0.75,
            maxOutputTokens: 250,
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error('Gemini API error:', errText);
        // Fall through to deterministic demo so the interview never dead-ends.
        return NextResponse.json({ content: demoReply(messages), demo: true });
      }

      const data = await response.json();
      const aiContent = data?.candidates?.[0]?.content || 'Scusa, non ho capito. Riprova.';
      return NextResponse.json({ content: aiContent });
    }

    if (process.env.OPENAI_API_KEY) {
      const promptMessages = [
        {
          role: 'system',
          content:
            'Sei Harid AI, un assistente colloqui in stile Gemini. Fai domande pertinenti al profilo candidato e fornisci feedback leggeri, orientati al career coaching.',
        },
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
        return NextResponse.json({ content: demoReply(messages), demo: true });
      }

      const openaiData = await openaiResponse.json();
      const aiContent =
        openaiData?.choices?.[0]?.message?.content || 'Scusa, non ho capito. Riprova.';
      return NextResponse.json({ content: aiContent });
    }

    // --- No key configured: deterministic demo interview ---
    return NextResponse.json({ content: demoReply(messages), demo: true });
  } catch (error) {
    console.error('Errore API generazione:', error);
    return NextResponse.json({ error: 'Errore generazione AI' }, { status: 500 });
  }
}
