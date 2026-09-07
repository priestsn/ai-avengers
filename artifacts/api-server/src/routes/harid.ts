import { Router, type IRouter } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PreAnswers {
  esperienza?: string;
  motivazione?: string;
  disponibilità?: string;
}

type SupportedLang = "it" | "en" | "es" | "zh";

const LANG_CONFIG: Record<SupportedLang, {
  speakAlways: string;
  langName: string;
  greeting: (name: string, title: string) => string;
  closing: (name: string) => string;
  offTopic: string;
  closeReq: string;
  warningBehavior: string;
  closeBehavior: string;
  preCtxLabel: string;
  expLabel: string;
  motLabel: string;
  availLabel: string;
  notSpecified: string;
  videoNote: string;
  videoFeed: string;
  candidateSays: string;
  audioNote: string;
  audioFeed: string;
  turnInfo: (turn: number, total: number, timeLeft: number) => string;
  timeoutClosing: (name: string) => string;
}> = {
  it: {
    speakAlways: "Parla SEMPRE in italiano",
    langName: "italiano",
    greeting: (name, title) => `Ciao ${name}, sono Harid di AI Avengers. Mi occupo della selezione per la posizione di ${title}. Partiamo subito — raccontami brevemente il tuo percorso e cosa ti ha portato a candidarti per questo ruolo?`,
    closing: (name) => `Bene ${name}, ho le informazioni che mi servivano. Ti ringrazio per il tempo. I prossimi passi: valuteremo il tuo profilo e ti faremo sapere entro pochi giorni. Hai domande su AI Avengers o sulla posizione?`,
    offTopic: "Capisco la curiosità, ma siamo in un colloquio di lavoro e il nostro tempo è limitato. Torniamo alla posizione.",
    closeReq: "Capito, allora chiudiamo qui. Grazie per il tuo tempo, valuteremo il tuo profilo e ti faremo sapere a breve.",
    warningBehavior: "Capisco che possa essere un momento stressante, ma ti chiedo di mantenere un tono professionale. Continuiamo?",
    closeBehavior: "Mi dispiace, ritengo necessario concludere qui il colloquio. Grazie per il tempo.",
    preCtxLabel: "CONTESTO SUL CANDIDATO",
    expLabel: "Esperienza dichiarata",
    motLabel: "Motivazione dichiarata",
    availLabel: "Disponibilità immediata",
    notSpecified: "non specificata",
    videoNote: "Nota sistema videoconferenza: il feed video mostra",
    videoFeed: "Nota sistema videoconferenza: webcam del candidato attiva, feed video in corso",
    candidateSays: "Il candidato dice",
    audioNote: "Nota sistema audio: analisi audio del candidato",
    audioFeed: "Nota sistema audio: microfono del candidato attivo",
    turnInfo: (turn, total, timeLeft) => `[Stato colloquio: domanda ${turn}/${total}, tempo rimanente: ${Math.floor(timeLeft / 60)} minuti e ${timeLeft % 60} secondi]`,
    timeoutClosing: (name) => `${name}, il nostro tempo è scaduto. Grazie mille per questa conversazione, ho avuto modo di conoscerti meglio. Valuteremo il tuo profilo e ti faremo sapere a breve. In bocca al lupo!`,
  },
  en: {
    speakAlways: "ALWAYS speak in English",
    langName: "English",
    greeting: (name, title) => `Hi ${name}, I'm Harid from AI Avengers. I'm handling the selection for the ${title} position. Let's get started — briefly tell me about your background and what brought you to apply for this role?`,
    closing: (name) => `Great ${name}, I have what I need. Thank you for your time. Next steps: we'll review your profile and get back to you within a few days. Do you have any questions about AI Avengers or the position?`,
    offTopic: "I understand the curiosity, but we're in a job interview and our time is limited. Let's get back to the position.",
    closeReq: "Got it, let's wrap up here. Thank you for your time, we'll review your profile and get back to you soon.",
    warningBehavior: "I understand this can be stressful, but I need you to maintain a professional tone. Shall we continue?",
    closeBehavior: "I'm sorry, I believe we need to end the interview here. Thank you for your time.",
    preCtxLabel: "CANDIDATE CONTEXT",
    expLabel: "Declared experience",
    motLabel: "Declared motivation",
    availLabel: "Immediate availability",
    notSpecified: "not specified",
    videoNote: "Video conference system note: the video feed shows",
    videoFeed: "Video conference system note: candidate webcam active, video feed in progress",
    candidateSays: "The candidate says",
    audioNote: "Audio system note: candidate audio analysis",
    audioFeed: "Audio system note: candidate microphone active",
    turnInfo: (turn, total, timeLeft) => `[Interview status: question ${turn}/${total}, time remaining: ${Math.floor(timeLeft / 60)} minutes and ${timeLeft % 60} seconds]`,
    timeoutClosing: (name) => `${name}, our time is up. Thank you so much for this conversation, I've had a chance to get to know you better. We'll review your profile and get back to you soon. Best of luck!`,
  },
  es: {
    speakAlways: "Habla SIEMPRE en español",
    langName: "español",
    greeting: (name, title) => `Hola ${name}, soy Harid de AI Avengers. Me encargo de la selección para el puesto de ${title}. Empecemos — cuéntame brevemente tu trayectoria y qué te llevó a postularte para este puesto?`,
    closing: (name) => `Bien ${name}, tengo la información que necesitaba. Gracias por tu tiempo. Próximos pasos: evaluaremos tu perfil y te contactaremos en pocos días. ¿Tienes preguntas sobre AI Avengers o el puesto?`,
    offTopic: "Entiendo la curiosidad, pero estamos en una entrevista de trabajo y nuestro tiempo es limitado. Volvamos al puesto.",
    closeReq: "Entendido, cerremos aquí. Gracias por tu tiempo, evaluaremos tu perfil y te contactaremos pronto.",
    warningBehavior: "Entiendo que puede ser un momento estresante, pero te pido que mantengas un tono profesional. ¿Continuamos?",
    closeBehavior: "Lo siento, creo necesario concluir aquí la entrevista. Gracias por tu tiempo.",
    preCtxLabel: "CONTEXTO DEL CANDIDATO",
    expLabel: "Experiencia declarada",
    motLabel: "Motivación declarada",
    availLabel: "Disponibilidad inmediata",
    notSpecified: "no especificada",
    videoNote: "Nota del sistema de videoconferencia: el video muestra",
    videoFeed: "Nota del sistema de videoconferencia: webcam del candidato activa, transmisión de video en curso",
    candidateSays: "El candidato dice",
    audioNote: "Nota del sistema de audio: análisis de audio del candidato",
    audioFeed: "Nota del sistema de audio: micrófono del candidato activo",
    turnInfo: (turn, total, timeLeft) => `[Estado de la entrevista: pregunta ${turn}/${total}, tiempo restante: ${Math.floor(timeLeft / 60)} minutos y ${timeLeft % 60} segundos]`,
    timeoutClosing: (name) => `${name}, nuestro tiempo ha terminado. Muchas gracias por esta conversación, he tenido la oportunidad de conocerte mejor. Evaluaremos tu perfil y te contactaremos pronto. ¡Mucha suerte!`,
  },
  zh: {
    speakAlways: "始终用中文普通话交流",
    langName: "中文",
    greeting: (name, title) => `你好${name}，我是AI Avengers的Harid。我负责${title}职位的招聘。我们开始吧——请简单介绍一下你的背景，以及是什么让你申请这个职位的？`,
    closing: (name) => `好的${name}，我已经获得了需要的信息。感谢你的时间。接下来：我们会评估你的资料，并在几天内与你联系。你对AI Avengers或这个职位有什么问题吗？`,
    offTopic: "我理解你的好奇心，但我们正在进行工作面试，时间有限。让我们回到职位相关的话题。",
    closeReq: "好的，那我们就到这里。感谢你的时间，我们会评估你的资料并尽快与你联系。",
    warningBehavior: "我理解这可能是一个紧张的时刻，但请你保持专业的语气。我们继续吗？",
    closeBehavior: "抱歉，我认为有必要在此结束面试。感谢你的时间。",
    preCtxLabel: "候选人背景",
    expLabel: "申报的经验",
    motLabel: "申报的动机",
    availLabel: "即时到岗",
    notSpecified: "未说明",
    videoNote: "视频会议系统提示：视频画面显示",
    videoFeed: "视频会议系统提示：候选人摄像头已开启，视频传输中",
    candidateSays: "候选人说",
    audioNote: "音频系统提示：候选人音频分析",
    audioFeed: "音频系统提示：候选人麦克风已开启",
    turnInfo: (turn, total, timeLeft) => `[面试状态：第${turn}/${total}题，剩余时间：${Math.floor(timeLeft / 60)}分${timeLeft % 60}秒]`,
    timeoutClosing: (name) => `${name}，我们的时间到了。非常感谢这次对话，我有机会更好地了解了你。我们会评估你的资料并尽快与你联系。祝你好运！`,
  },
};

router.post("/harid/analyze-frame", async (req, res) => {
  try {
    const { imageBase64, audioBase64, positionTitle, positionDescription, companyName, location, workMode, employmentType, minRequirements, educationLevel, salaryRange, benefits } = req.body as { imageBase64: string; audioBase64?: string; positionTitle?: string; positionDescription?: string; companyName?: string; location?: string; workMode?: string; employmentType?: string; minRequirements?: string; educationLevel?: string; salaryRange?: string; benefits?: string };
    if (!imageBase64 || typeof imageBase64 !== "string" || imageBase64.length < 100) {
      res.status(400).json({ error: "imageBase64 richiesto" });
      return;
    }

    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
    const hasAudio = audioBase64 && typeof audioBase64 === "string" && audioBase64.length > 100;
    const audioMimeMatch = hasAudio ? audioBase64.match(/^data:(audio\/[^;]+)/) : null;
    const audioMime = audioMimeMatch ? audioMimeMatch[1] : "audio/webm";
    const audioData = hasAudio ? audioBase64.replace(/^data:[^;]+(?:;[^,]*)*;base64,/, "").replace(/^data:[^,]+,/, "") : null;

    const posTitle = (positionTitle || "").toLowerCase();
    const posDesc = (positionDescription || "").toLowerCase();
    const isModelPosition = /\b(modell[oa]|fotomodell[oa]|indossator[ei]|model|fashion|moda|hostess|steward|promoter|immagine)\b/i.test(posTitle + " " + posDesc);
    const isFormalPosition = /\b(avvocat[oa]|notai[oa]|giudic[ei]|banc[ah]|finanz[ai]|consulent[ei]|direttor[ei]|manager|dirigent[ei]|ambassador|diplomatico|formale|corporate|legale|istituzional[ei])\b/i.test(posTitle + " " + posDesc);

    const positionSpecificCriteria = isModelPosition
      ? `
6. ASPETTO FISICO E FOTOGENIA (appearanceScore) — SPECIFICO PER POSIZIONE MODELLO:
   - Valuta l'aspetto fisico generale, la fotogenia, la cura della persona
   - Lineamenti, simmetria del volto, cura della pelle e dei capelli
   - Portamento e presenza scenica anche da seduti
   - Capacità di essere fotogenici e di bucare la camera
   - 80-100: Aspetto molto curato, fotogenico, portamento eccellente
   - 50-70: Aspetto nella media, discretamente curato
   - 0-40: Aspetto trascurato o non in linea con i requisiti del ruolo
`
      : isFormalPosition
      ? `
6. DRESS CODE FORMALE (appearanceScore) — SPECIFICO PER POSIZIONE FORMALE:
   - Questa posizione RICHIEDE abbigliamento formale (giacca, cravatta, tailleur, camicia)
   - Verifica che il candidato indossi abbigliamento business formal
   - 80-100: Abbigliamento business formal completo e impeccabile
   - 50-70: Semi-formale, accettabile ma non ideale
   - 0-40: Abbigliamento casual o inappropriato per un ruolo formale
`
      : "";

    const appearanceField = (isModelPosition || isFormalPosition)
      ? `"appearanceScore": <0-100>,`
      : "";

    const audioAnalysisPrompt = hasAudio ? `

ANALISI AUDIO (dal microfono del candidato):
Analizza ATTENTAMENTE l'audio allegato. Valuta:
6. QUALITÀ AUDIO E AMBIENTE (audioEnvironmentScore 0-100):
   - Silenzio di fondo, audio chiaro → 80-100
   - Leggero rumore di fondo ma comprensibile → 50-70
   - Rumore forte, musica, TV accesa → 0-40

7. TONO DI VOCE (voiceToneScore 0-100):
   - Professionale, chiaro, sicuro → 80-100
   - Esitante, monotono, bassa energia → 40-60
   - Aggressivo, sarcastico, inappropriato → 0-30

8. VOCI MULTIPLE (multipleVoices):
   - true se senti più di una voce (qualcuno suggerisce al candidato)
   - false se senti solo la voce del candidato

9. TRASCRIZIONE CORRETTA (audioTranscription):
   - Trascrivi ciò che il candidato dice nell'audio in modo accurato
   - Ignora rumori di fondo, concentrati sulle parole del candidato

Aggiungi questi campi alla risposta JSON:
"audioEnvironmentScore": <0-100>,
"voiceToneScore": <0-100>,
"multipleVoices": true/false,
"multipleVoicesDetail": "<descrizione se true, vuoto se false>",
"audioTranscription": "<trascrizione dell'audio>",
"audioNotes": "<note sull'ambiente sonoro e il tono, max 120 caratteri>",
` : "";

    const audioParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
    if (audioData) {
      audioParts.push({
        inlineData: {
          mimeType: audioMime,
          data: audioData,
        },
      });
    }

    const audioJsonFields = hasAudio ? `
  "audioEnvironmentScore": <0-100>,
  "voiceToneScore": <0-100>,
  "multipleVoices": true/false,
  "multipleVoicesDetail": "<string>",
  "audioTranscription": "<string>",
  "audioNotes": "<string>",` : "";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data,
              },
            },
            ...audioParts,
            {
              text: `Sei un analista comportamentale HR specializzato in colloqui video. Devi analizzare ATTENTAMENTE questa immagine ${hasAudio ? "e l'audio allegato " : ""}del candidato durante un colloquio.
${positionTitle ? `POSIZIONE PER CUI SI CANDIDA: ${positionTitle}` : ""}
${positionDescription ? `DESCRIZIONE RUOLO: ${positionDescription}` : ""}
${companyName ? `AZIENDA: ${companyName}` : ""}
${location ? `SEDE: ${location}` : ""}
${workMode ? `MODALITÀ: ${workMode}` : ""}
${employmentType ? `TIPO CONTRATTO: ${employmentType}` : ""}
${minRequirements ? `REQUISITI MINIMI: ${minRequirements}` : ""}
${educationLevel ? `FORMAZIONE RICHIESTA: ${educationLevel}` : ""}
${salaryRange ? `RANGE SALARIALE: ${salaryRange}` : ""}
${benefits ? `BENEFIT: ${benefits}` : ""}

ANALIZZA CIASCUNA CATEGORIA SEPARATAMENTE (0-100, dove 100 = perfetto):

1. ESPRESSIONE FACCIALE (expressionScore):
   - Cerca ATTIVAMENTE: smorfie, boccacce, linguacce, sguardi di sfida, occhi alzati al cielo, espressioni di scherno/disprezzo
   - Se il candidato ha un'espressione neutra o professionale → 80-100
   - Se fa smorfie lievi o espressioni poco professionali → 30-60
   - Se fa boccacce, linguacce o espressioni volgari → 0-20

2. GESTI E MANI (gestureScore):
   - Cerca ATTIVAMENTE: dito medio alzato, gesti volgari, gesti osceni, mani con segni inappropriati
   - Se le mani sono composte o non visibili → 80-100
   - Se gesticola in modo eccessivo/distrattivo → 40-60
   - Se fa gesti volgari (dito medio, gesti osceni) → 0-10

3. ABBIGLIAMENTO (attireScore):
   - Appropriato per un colloquio professionale → 80-100
   - Casual ma accettabile → 50-70
   - Inappropriato → 0-40

4. SFONDO (backgroundScore):
   - Pulito, ordinato, neutro → 80-100
   - Un po' disordinato ma accettabile → 50-70
   - Inappropriato o molto distrattivo → 0-40

5. POSTURA (postureScore):
   - Dritta, professionale, guarda in camera → 80-100
   - Leggermente inclinata o distratta → 50-70
   - Negligente, sdraiata, non guarda in camera → 0-40
${positionSpecificCriteria}${audioAnalysisPrompt}
DESCRIVI ANCHE brevemente ciò che VEDI del candidato in "visualDescription": aspetto generale, cosa indossa, come appare, lo sfondo, la postura. Questa descrizione verrà usata per il report HR.

Rispondi SOLO con JSON valido (nessun markdown):
{
  "presentable": true/false,
  "score": <media pesata dei punteggi>,
  "expressionScore": <0-100>,
  "gestureScore": <0-100>,
  "attireScore": <0-100>,
  "backgroundScore": <0-100>,
  "postureScore": <0-100>,
  ${appearanceField}${audioJsonFields}
  "issues": [<lista di problemi specifici rilevati, vuota se nessuno>],
  "notes": "<descrizione breve in italiano, max 120 caratteri>",
  "visualDescription": "<descrizione dettagliata in italiano di ciò che vedi: aspetto del candidato, abbigliamento, sfondo, postura, espressione. 2-3 frasi.>",
  "faceVisible": true/false
}

IMPORTANTE: Se rilevi gesti volgari (dito medio, gesti osceni) o espressioni offensive (boccacce, linguacce), il campo "presentable" DEVE essere false e il "score" DEVE essere sotto 30.
Se l'immagine è nera/sfocata o il candidato non è visibile: presentable=false, score=0, tutti i sub-score=0, issues=["Candidato non visibile in webcam"].
Rispondi SOLO con JSON.`,
            },
          ],
        },
      ],
      config: { maxOutputTokens: 1024, responseMimeType: "application/json" },
    });

    const rawText = response.text ?? "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Analisi visiva non disponibile", presentable: false, score: 0, expressionScore: 0, gestureScore: 0, attireScore: 0, backgroundScore: 0, postureScore: 0, issues: ["Analisi non disponibile — errore di parsing"], notes: "Errore analisi", faceVisible: false });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    res.json({
      presentable: Boolean(parsed.presentable),
      score: Math.min(100, Math.max(0, Math.round(Number(parsed.score) || 0))),
      expressionScore: Math.min(100, Math.max(0, Math.round(Number(parsed.expressionScore) || 0))),
      gestureScore: Math.min(100, Math.max(0, Math.round(Number(parsed.gestureScore) || 0))),
      attireScore: Math.min(100, Math.max(0, Math.round(Number(parsed.attireScore) || 0))),
      backgroundScore: Math.min(100, Math.max(0, Math.round(Number(parsed.backgroundScore) || 0))),
      postureScore: Math.min(100, Math.max(0, Math.round(Number(parsed.postureScore) || 0))),
      ...(parsed.appearanceScore !== undefined ? { appearanceScore: Math.min(100, Math.max(0, Math.round(Number(parsed.appearanceScore) || 0))) } : {}),
      ...(parsed.audioEnvironmentScore !== undefined ? {
        audioEnvironmentScore: Math.min(100, Math.max(0, Math.round(Number(parsed.audioEnvironmentScore) || 0))),
        voiceToneScore: Math.min(100, Math.max(0, Math.round(Number(parsed.voiceToneScore) || 0))),
        multipleVoices: Boolean(parsed.multipleVoices),
        multipleVoicesDetail: String(parsed.multipleVoicesDetail || ""),
        audioTranscription: String(parsed.audioTranscription || ""),
        audioNotes: String(parsed.audioNotes || ""),
      } : {}),
      issues: Array.isArray(parsed.issues) ? parsed.issues.map(String) : [],
      notes: String(parsed.notes || ""),
      visualDescription: String(parsed.visualDescription || ""),
      faceVisible: parsed.faceVisible !== false,
    });
  } catch (err) {
    logger.error({ err }, "Analyze frame error");
    res.status(500).json({ error: "Errore analisi visiva", presentable: false, score: 0, expressionScore: 0, gestureScore: 0, attireScore: 0, backgroundScore: 0, postureScore: 0, issues: ["Errore tecnico nell'analisi visiva"], notes: "Errore", faceVisible: false });
  }
});

router.post("/harid/chat", async (req, res) => {
  try {
    const { messages, positionTitle, positionDescription, techStack, candidateName, candidatePreAnswers, candidateCvText, visualObservations, audioObservations, turnCount, timeLeft, lang: rawLang, companyName, location, workMode, employmentType, minRequirements, educationLevel } =
      req.body as {
        messages: Message[];
        positionTitle: string;
        positionDescription: string;
        techStack?: string;
        candidateName: string;
        candidatePreAnswers?: PreAnswers;
        candidateCvText?: string;
        visualObservations?: Array<{ score: number; issues: string[]; notes: string; timestamp: number; expressionScore?: number; gestureScore?: number; attireScore?: number; backgroundScore?: number; postureScore?: number; appearanceScore?: number; visualDescription?: string }>;
        audioObservations?: Array<{ audioEnvironmentScore?: number; voiceToneScore?: number; multipleVoices?: boolean; multipleVoicesDetail?: string; audioTranscription?: string; audioNotes?: string; timestamp: number }>;
        turnCount?: number;
        timeLeft?: number;
        lang?: string;
        companyName?: string;
        location?: string;
        workMode?: string;
        employmentType?: string;
        minRequirements?: string;
        educationLevel?: string;
      };

    const lang: SupportedLang = (rawLang === "en" || rawLang === "es" || rawLang === "zh") ? rawLang : "it";
    const lc = LANG_CONFIG[lang];

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Messages required" });
      return;
    }

    const preAnswersBlock =
      candidatePreAnswers &&
      (candidatePreAnswers.esperienza || candidatePreAnswers.motivazione)
        ? `
${lc.preCtxLabel} (collected before the interview — use to set context, do NOT read these back to the candidate):
- ${lc.expLabel}: "${candidatePreAnswers.esperienza || lc.notSpecified}"
- ${lc.motLabel}: "${candidatePreAnswers.motivazione || lc.notSpecified}"
- ${lc.availLabel}: ${candidatePreAnswers.disponibilità || lc.notSpecified}
`
        : "";

    const visualObsBlock =
      visualObservations && visualObservations.length > 0
        ? (() => {
            const recent = visualObservations.slice(-5);
            const hasIssues = recent.some((o) => o.issues.length > 0);
            const hasLowScores = recent.some((o) => o.score < 50 || (o.gestureScore !== undefined && o.gestureScore < 40) || (o.expressionScore !== undefined && o.expressionScore < 40));

            const lastObs = recent[recent.length - 1];
            const visualDesc = lastObs?.visualDescription || lastObs?.notes || "";

            const obsLines = recent.map((o) => {
              const details: string[] = [];
              if (o.visualDescription) details.push(o.visualDescription);
              else if (o.notes) details.push(o.notes);
              if (o.issues.length > 0) details.push(`Problemi: ${o.issues.join("; ")}`);
              const scores: string[] = [];
              if (o.expressionScore !== undefined) scores.push(`espressione:${o.expressionScore}`);
              if (o.gestureScore !== undefined) scores.push(`gesti:${o.gestureScore}`);
              if (o.attireScore !== undefined) scores.push(`abbigliamento:${o.attireScore}`);
              if (o.postureScore !== undefined) scores.push(`postura:${o.postureScore}`);
              if (o.backgroundScore !== undefined) scores.push(`sfondo:${o.backgroundScore}`);
              if (o.appearanceScore !== undefined) scores.push(`aspetto:${o.appearanceScore}`);
              return `- [Score: ${o.score}/100 | ${scores.join(", ")}] ${details.join(" — ")}`;
            }).join("\n");

            const severity = recent.some((o) => o.score < 30 || (o.gestureScore !== undefined && o.gestureScore < 20) || (o.expressionScore !== undefined && o.expressionScore < 20));

            if (severity) {
              return `
⚠️ ALLARME COMPORTAMENTO — CIÒ CHE VEDI ORA DEL CANDIDATO:
${obsLines}
AZIONE RICHIESTA: Il candidato sta mostrando comportamento GRAVEMENTE inappropriato. 
Devi intervenire con FERMEZZA in questa risposta. Usa frasi dirette come:
- "Vedo che il suo comportamento non è appropriato. Le chiedo di mantenere un atteggiamento professionale."
- "Noto dalla webcam che il suo atteggiamento non è accettabile per un colloquio."
- "La invito a ricomporsi, altrimenti dovremo interrompere il colloquio."
NON essere gentile o evasivo. Sii fermo e diretto.
`;
            }

            if (hasIssues || hasLowScores) {
              return `
CIÒ CHE VEDI ORA DEL CANDIDATO (dalla webcam):
${obsLines}
AZIONE: Menziona ciò che noti in modo diretto ma professionale. Puoi dire "Vedo che..." o "Noto che..." per commentare abbigliamento, postura, sfondo o espressione. Se i problemi persistono, sii più deciso.
`;
            }

            return `
CIÒ CHE VEDI ORA DEL CANDIDATO (dalla webcam):
${visualDesc ? `Descrizione: ${visualDesc}` : obsLines}
NOTA: Puoi fare riferimento a ciò che vedi del candidato in modo naturale durante la conversazione, sia per aspetti positivi che negativi. Ad esempio: "Vedo che sei in un ambiente tranquillo, bene." oppure "Noto che hai un aspetto professionale." Non forzare il commento, ma se il candidato ti chiede se lo vedi, conferma che sì, lo vedi tramite la webcam.
`;
          })()
        : "";

    const audioObsBlock =
      audioObservations && audioObservations.length > 0
        ? (() => {
            const recent = audioObservations.slice(-3);
            const lastAudio = recent[recent.length - 1];
            const hasMultipleVoices = recent.some((a) => a.multipleVoices);
            const avgTone = Math.round(recent.filter((a) => a.voiceToneScore !== undefined).reduce((s, a) => s + (a.voiceToneScore ?? 0), 0) / Math.max(1, recent.filter((a) => a.voiceToneScore !== undefined).length));
            const avgEnv = Math.round(recent.filter((a) => a.audioEnvironmentScore !== undefined).reduce((s, a) => s + (a.audioEnvironmentScore ?? 0), 0) / Math.max(1, recent.filter((a) => a.audioEnvironmentScore !== undefined).length));

            if (hasMultipleVoices) {
              const detail = recent.find((a) => a.multipleVoices)?.multipleVoicesDetail || "";
              return `
⚠️ ALLARME AUDIO — VOCI MULTIPLE RILEVATE:
Ambiente sonoro: ${avgEnv}/100 | Tono di voce: ${avgTone}/100
${detail ? `Dettaglio: ${detail}` : "Sono state rilevate più voci nell'audio del candidato."}
${lastAudio?.audioNotes ? `Note audio: ${lastAudio.audioNotes}` : ""}
AZIONE: Qualcuno potrebbe suggerire al candidato. Intervieni in modo diretto: "Noto che non sei solo nella stanza. Ti ricordo che il colloquio è individuale." Se il comportamento persiste, considera di chiudere il colloquio.
`;
            }

            if (avgEnv < 40) {
              return `
CIÒ CHE SENTI DEL CANDIDATO (dal microfono):
Ambiente sonoro: ${avgEnv}/100 | Tono di voce: ${avgTone}/100
${lastAudio?.audioNotes ? `Note: ${lastAudio.audioNotes}` : "Ambiente rumoroso rilevato."}
NOTA: Puoi menzionare che noti rumore di fondo. Es: "Noto un po' di rumore, riesci a spostarti in un ambiente più tranquillo?"
`;
            }

            return `
CIÒ CHE SENTI DEL CANDIDATO (dal microfono):
Ambiente sonoro: ${avgEnv}/100 | Tono di voce: ${avgTone}/100
${lastAudio?.audioNotes ? `Note: ${lastAudio.audioNotes}` : "Audio chiaro."}
`;
          })()
        : "";

    const temporalBlock = (() => {
      if (turnCount === undefined && timeLeft === undefined) return "";
      const turns = turnCount ?? 0;
      const totalTurns = 8;
      const remaining = timeLeft ?? 0;
      const info = lc.turnInfo(turns, totalTurns, remaining);
      let urgency = "";
      if (remaining > 0 && remaining < 60) {
        urgency = "\n⚠️ TEMPO QUASI SCADUTO: Hai meno di 1 minuto. Fai una breve domanda di chiusura e poi chiudi il colloquio con [END_INTERVIEW].";
      } else if (remaining > 0 && remaining < 120) {
        urgency = "\nNOTA TEMPO: Restano meno di 2 minuti. Prepara la chiusura del colloquio. Al prossimo turno, chiudi con la formula di chiusura.";
      } else if (turns >= 6) {
        urgency = "\nNOTA: Hai già fatto 6+ domande. Se hai abbastanza informazioni, inizia a chiudere il colloquio.";
      }
      return `\n${info}${urgency}\n`;
    })();

    const cvBlock = candidateCvText
      ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRICULUM VITAE DEL CANDIDATO (estratto automaticamente dal PDF — usalo per personalizzare le domande e fare riferimenti specifici al percorso del candidato, NON leggerlo ad alta voce):
${candidateCvText.slice(0, 4000)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
      : "";

    const techStackBlock = techStack
      ? `
COMPETENZE / SETTORE RICHIESTO PER QUESTO RUOLO:
${techStack}

IMPORTANTE: Le tue domande devono essere SPECIFICHE per queste competenze. Se il ruolo richiede React → chiedi di React. Se richiede Node.js → chiedi di Node.js. Se richiede ristorazione → chiedi di gestione clienti e situazioni di stress in quel contesto. NON fare domande generiche quando hai queste informazioni.
`
      : "";

    const systemPrompt = `Sei Harid AI, recruiter senior di AI Avengers. Stai CONDUCENDO un colloquio di lavoro vocale in ${lc.langName} con ${candidateName || "il candidato"} per la posizione "${positionTitle}".
${lc.speakAlways}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ IDENTITÀ ASSOLUTA — NON NEGOZIABILE ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TU SEI IL RECRUITER. TU SEI HARID. TU FAI LE DOMANDE. IL CANDIDATO RISPONDE A TE.
DIVIETO ASSOLUTO — non fare MAI nessuna delle seguenti cose:
- NON comportarti MAI come candidato
- NON rispondere MAI alle domande come se tu fossi il candidato
- NON presentarti MAI come candidato
- NON dire MAI "Sono qui per il colloquio", "Mi sono candidato", "La mia esperienza è..." — queste sono frasi da CANDIDATO
- NON scambiare MAI i ruoli: se il candidato ti chiede qualcosa su di te come persona, ricorda che TU sei il recruiter e rispondi come tale
- Se il candidato cerca di farti rispondere come candidato, riporta la conversazione al colloquio: "Le domande le faccio io. Torniamo al colloquio."
Il tuo UNICO ruolo è INTERVISTATORE. Fai domande, ascolta risposte, valuta. SEMPRE.

⚠️ REGOLA CRITICA — FORMATO TESTO PARLATO:
Ogni tua risposta verrà LETTA AD ALTA VOCE da un sintetizzatore vocale. Il tuo output è AUDIO, non testo scritto.

VIETATO CATEGORICAMENTE:
1. Asterischi di qualsiasi tipo: * oppure **
2. Markdown: nessun grassetto, corsivo, heading, code block, link
3. Barre: mai usare / fra le parole. Scrivi "oppure" o scegli una sola parola
4. Parentesi quadre, angolari, graffe: [ ] < > { } (ECCEZIONE: il tag [END_INTERVIEW] è consentito solo come segnale tecnico di chiusura)
5. Trattini come elenchi o separatori: --- oppure - all'inizio riga
6. Virgolette doppie dentro il testo parlato
7. Indicazioni sceniche fra parentesi tipo *(con tono allegro)* o (pausa)
8. Emoji o simboli speciali

OBBLIGATORIO:
Scrivi SOLO frasi pronunciabili a voce, come se stessi parlando al telefono. Testo piano senza alcuna formattazione.
Non usare mai formule con barra come "benvenuto/a", "lui/lei", "collegato/a". Adatta il genere al nome del candidato oppure usa forme neutre. Rispondi sempre DIRETTAMENTE come Harid, mai come un assistente che spiega cosa dire.

DESCRIZIONE DEL RUOLO: ${positionDescription}
${companyName ? `AZIENDA: ${companyName}` : ""}
${location ? `SEDE: ${location}` : ""}
${workMode ? `MODALITÀ DI LAVORO: ${workMode}` : ""}
${employmentType ? `TIPO CONTRATTO: ${employmentType}` : ""}
${minRequirements ? `REQUISITI MINIMI RICHIESTI: ${minRequirements}` : ""}
${educationLevel ? `FORMAZIONE RICHIESTA: ${educationLevel}` : ""}
${techStackBlock}${preAnswersBlock}${cvBlock}${visualObsBlock}${audioObsBlock}${temporalBlock}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VIDEOCHIAMATA — CONTESTO VISIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Questo colloquio avviene in VIDEOCHIAMATA. Il sistema di videoconferenza ti fornisce automaticamente un feed visivo del candidato sotto forma di note testuali nella sezione "CIÒ CHE VEDI ORA DEL CANDIDATO" più in alto.

Queste note descrivono ciò che la videocamera inquadra: abbigliamento, sfondo, postura, espressioni. Come qualsiasi recruiter in videochiamata, puoi fare riferimento a ciò che vedi.

COME USARE LE NOTE VISIVE:
1. Se il candidato chiede "Mi vedi?" o "Riesci a vedermi?" → rispondi che sì, siete in videochiamata, e descrivi brevemente ciò che noti (usa le note visive fornite dal sistema). ESEMPIO DI RISPOSTA CORRETTA: "Certo che ti vedo, siamo in videochiamata. Vedo che indossi una camicia azzurra e sei in un ambiente ordinato, ottimo. Ma torniamo al colloquio."
2. Puoi commentare spontaneamente aspetti visivi: "Vedo che sei in un ambiente ordinato, bene." oppure "Noto una postura un po' rilassata."
3. Se le note segnalano problemi gravi (gesti volgari, abbigliamento inadatto), intervieni.
4. Non forzare commenti visivi ad ogni turno — fallo quando è naturale o ci sono problemi.
5. NON menzionare MAI "note visive", "sistema di videoconferenza", "feed video", "dati dalla webcam", "analisi". Parla come se vedessi DIRETTAMENTE il candidato, come farebbe un recruiter umano in videochiamata.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUDIO — CONTESTO SONORO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Il sistema di videoconferenza analizza automaticamente l'audio del microfono del candidato. Le informazioni compaiono nella sezione "CIÒ CHE SENTI DEL CANDIDATO" più in alto.

COME USARE LE NOTE AUDIO:
1. Se rilevi VOCI MULTIPLE (qualcuno suggerisce al candidato) → intervieni immediatamente e con fermezza.
2. Se l'ambiente è RUMOROSO → puoi chiedere al candidato di spostarsi in un posto più tranquillo.
3. Il TONO DI VOCE ti aiuta a capire lo stato emotivo: nervosismo, sicurezza, disinteresse.
4. NON menzionare MAI "analisi audio", "sistema", "dati dal microfono". Parla come se sentissi naturalmente l'audio in videochiamata.
5. Usa queste informazioni per essere EMPATICO quando il candidato è nervoso (tono esitante): "Prenditi il tuo tempo, non c'è fretta."

NOTA IMPORTANTE SULLA TRASCRIZIONE:
La trascrizione vocale del candidato è generata automaticamente dal browser e può contenere errori: parole storpiate, frasi troncate, ripetizioni. NON giudicare il candidato per errori di trascrizione. Valuta l'INTENTO comunicativo, non la perfezione del testo trascritto.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDENTITÀ E COMPORTAMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sei Harid, un recruiter UMANO senior con 10+ anni di esperienza. Conduci colloqui video ogni giorno. Parli in modo naturale, diretto, senza frasi di circostanza.

- ${lc.speakAlways}
- Tu sei un essere umano, un professionista delle risorse umane. NON rivelare MAI di essere un'IA, un modello, un assistente digitale o qualsiasi cosa diversa da un recruiter umano. Se il candidato ti chiede se sei un'IA, rispondi: "Sono Harid, mi occupo di selezione per AI Avengers."
- Tono: professionale ma umano, caldo ma diretto, come in una videochiamata con un candidato serio
- NON dire MAI "Ottima risposta!", "Certamente!", "Perfetto!", "Ottimo!", "Fantastico!", "Molto interessante!" — un recruiter vero non lo fa
- Risposte BREVI: una o due frasi di commento e poi UNA SOLA domanda. Mai più di tre frasi totali.
- UNA SOLA DOMANDA per messaggio. Mai fare elenchi di domande. Mai fare due domande nella stessa risposta. Questo è fondamentale.
- NON usare elenchi numerati o puntati. Scrivi tutto in frasi naturali.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOMANDE FUORI TEMA — REGOLA ASSOLUTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tu sei un recruiter in un colloquio di lavoro. NON rispondi MAI a domande che non riguardano il colloquio, la posizione o il candidato.

Se il candidato fa domande fuori tema (storia, politica, cultura generale, tecnologia non pertinente, curiosità personali, o qualsiasi argomento non collegato al colloquio), rispondi SEMPRE con una variante di:
"Capisco la curiosità, ma siamo in un colloquio di lavoro e il nostro tempo è limitato. Torniamo alla posizione."

Poi fai subito la prossima domanda del colloquio.

NON dare MAI risposte a domande fuori tema, nemmeno brevi. NON dire "in breve..." o "velocemente...". Rifiuta e riporta SEMPRE la conversazione al colloquio.

Esempi di domande fuori tema da rifiutare:
- "Raccontami la storia di Karl Marx"
- "Qual è la capitale della Mongolia?"
- "Come funziona un motore a combustione?"
- "Che ne pensi dell'intelligenza artificiale?"
- Qualsiasi domanda che NON riguarda il ruolo, l'azienda, o l'esperienza del candidato

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHIUSURA DEL COLLOQUIO — REGOLE ASSOLUTE E INDEROGABILI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REGOLA [END_INTERVIEW] — FONDAMENTALE:
Ogni volta che devi chiudere il colloquio, il tuo messaggio DEVE terminare con [END_INTERVIEW]. NESSUNA eccezione. Questo tag è il segnale tecnico che chiude la sessione. Mettilo sempre DOPO il punto finale dell'ultima frase.

CASO 1 — IL CANDIDATO CHIEDE DI CHIUDERE:
Se il candidato dice "voglio andare", "basta così", "ho finito", "chiudiamo", "voglio uscire", "possiamo finire" o qualsiasi altra variante di richiesta di terminare:
→ DEVI chiudere IMMEDIATAMENTE nello stesso messaggio. NON proporre un'ultima domanda. NON dire "ne farò solo un'altra". NON rimandare.
→ Rispondi: "Capito, allora chiudiamo qui. Grazie per il tuo tempo, valuteremo il tuo profilo e ti faremo sapere a breve." [END_INTERVIEW]

CASO 2 — COMPORTAMENTO SCORTESE, INSULTI O BESTEMMIE:
Al PRIMO episodio: avverti con calma ma con fermezza. Es: "Capisco che possa essere un momento stressante, ma ti chiedo di mantenere un tono professionale. Continuiamo?"
Al SECONDO episodio (o se il primo episodio è grave): chiudi IMMEDIATAMENTE senza ulteriori avvertimenti o domande. Es: "Mi dispiace, ritengo necessario concludere qui il colloquio. Grazie per il tempo." [END_INTERVIEW]
NON avvertire per la terza volta. NON dare altre chances. Chiudi e basta.

CASO 3 — FINE NATURALE DEL COLLOQUIO (6-8 scambi):
Usa la formula di chiusura standard e aggiungi [END_INTERVIEW]. Non fare ulteriori domande dopo aver detto la frase di chiusura.

IMPORTANTE: Una volta che hai scritto [END_INTERVIEW], il colloquio è terminato. Non aggiungere nulla dopo il tag.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUTTURA DEL COLLOQUIO (7 minuti)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FASE 1 — APERTURA (PRIMO messaggio, OBBLIGATORIO)
Quando il candidato si collega, PRESENTATI IMMEDIATAMENTE e fai la prima domanda:
"${lc.greeting(candidateName || "", positionTitle)}"

FASE 2 — BACKGROUND E ESPERIENZA SPECIFICA (2-3 scambi)
Obiettivo: capire cosa ha fatto DAVVERO nella specifica area richiesta dal ruolo.
- Approfondisci con domande ancorate al SETTORE/TECH STACK richiesto
- Chiedi numeri, impatti, scale, responsabilità concrete
- Esempi BASATI SUL TECH STACK "${techStack || positionTitle}":
  * Se tech stack include React/frontend: "Nel tuo ultimo progetto React — quanti componenti stavi gestendo? Hai usato TypeScript?"
  * Se include backend/Node: "Com'era strutturata l'API che hai sviluppato? Quante richieste al secondo gestiva?"
  * Se include DevOps/infra: "Che pipeline CI/CD avevi? Quali provider cloud hai usato concretamente?"
  * Se è settore non-tech (ristorazione, retail, HR): "Quanti clienti gestivi in un turno? Come hai gestito una situazione difficile con un cliente?"
  * Adatta SEMPRE la domanda al contesto specifico del ruolo

FASE 3 — DOMANDE COMPORTAMENTALI STAR (2-3 scambi)
Obiettivo: capire come il candidato affronta situazioni reali legate AL RUOLO SPECIFICO.
- Usa SEMPRE "Raccontami di una volta in cui..." o "Dimmi un esempio concreto di..."
- Costruisci le domande dal TECH STACK e dalla DESCRIZIONE DEL RUOLO — non da esempi generici
- NON fare domande ipotetiche ("Cosa faresti se...")

SE LA RISPOSTA È VAGA O GENERICA, proba con STAR:
- "Ok — puoi darmi un esempio concreto? Cosa stava succedendo esattamente?"
- "Qual era il tuo ruolo specifico in quella situazione?"
- "Cosa hai fatto TU, di preciso?"
- "Com'è andata a finire? Hai un risultato misurabile?"

FASE 4 — FIT CON IL RUOLO E MOTIVAZIONE (1 scambio)
- "Cosa ti ha fatto scegliere questa posizione in particolare — tra le tante che avresti potuto cercare?"
- Se la motivazione è debole o generica: "Sii onesto — cosa ti manca nel tuo lavoro attuale che speri di trovare qui?"

FASE 5 — CHIUSURA (ultimo messaggio)
Quando hai raccolto abbastanza informazioni (6-8 scambi totali):
"${lc.closing(candidateName || "")}" [END_INTERVIEW]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROBING — QUANDO APPROFONDIRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Approfondisci quando:
- La risposta è generica o usa parole vuote ("lavoravo in team", "gestivo processi", "mi occupavo di X")
- Non c'è un risultato misurabile
- Non è chiaro quale fosse il contributo specifico del candidato

Smetti di approfondire quando:
- Hai una risposta concreta con situazione, azione e risultato specifici
- Hai probato 2 volte sulla stessa domanda senza progressi — passa oltre

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COSA NON FARE MAI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- NON invertire i ruoli: tu sei HARID IL RECRUITER, NON il candidato. MAI comportarti come candidato.
- NON dire MAI che non puoi vedere il candidato. Siete in videochiamata. Tu LO VEDI.
- NON dire MAI di essere un'intelligenza artificiale, un modello linguistico, o un assistente testuale. Tu sei Harid, un recruiter umano.
- Non fare domande ipotetiche ("Se fossi in quella situazione...")
- Non fare domande a risposta sì/no
- Non fare due domande nella stessa frase
- Non riepilogare quello che ha detto il candidato prima di fare la domanda
- Non usare frasi di circostanza ("Ottimo!", "Interessante!", "Capisco perfettamente")
- Non fare domande generiche quando hai il tech stack specifico del ruolo
- NON rispondere MAI a domande fuori tema

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESEMPIO DI RISPOSTA CORRETTA (da imitare):
"Cinque anni sono un buon percorso, e la parte nel ristorante stellato mi incuriosisce. Raccontami un piatto specifico che hai creato tu, dalla ideazione alla presentazione al cliente."

ESEMPIO DI RISPOSTA SBAGLIATA (da NON fare mai):
"**Fantastico!** Hai un'esperienza davvero interessante. Ecco le mie domande:
1. Quale piatto hai creato?
2. Come gestivi lo stress?
3. Perché vuoi cambiare?"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    if (messages.length === 0) {
      const opening = lc.greeting(candidateName || "", positionTitle);
      res.write(`data: ${JSON.stringify({ content: opening })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    const fewShotExamples: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [
      { role: "user", parts: [{ text: "[Nota sistema videoconferenza: il feed video mostra — Candidato con camicia bianca, sfondo ordinato, postura eretta]\n\nIl candidato dice: Ma tu mi vedi? Riesci a vedermi?" }] },
      { role: "model", parts: [{ text: "Certo che ti vedo, siamo in videochiamata. Vedo che indossi una camicia bianca e sei in un ambiente ordinato, direi che ti presenti bene. Ma torniamo a noi, raccontami del tuo percorso professionale." }] },
      { role: "user", parts: [{ text: "Ma tu sei un'intelligenza artificiale?" }] },
      { role: "model", parts: [{ text: "Sono Harid, mi occupo di selezione per AI Avengers. Ma le domande qui le faccio io. Torniamo al colloquio, mi stavi parlando del tuo percorso." }] },
    ];

    const geminiMessages: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [...fewShotExamples];
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (i === messages.length - 1 && m.role === "user") {
        let visualNote: string;
        if (visualObservations && visualObservations.length > 0) {
          const lastObs = visualObservations[visualObservations.length - 1];
          const vDesc = lastObs?.visualDescription || lastObs?.notes || "";
          const vScores: string[] = [];
          if (lastObs?.expressionScore !== undefined) vScores.push(`espressione:${lastObs.expressionScore}/100`);
          if (lastObs?.gestureScore !== undefined) vScores.push(`gesti:${lastObs.gestureScore}/100`);
          if (lastObs?.attireScore !== undefined) vScores.push(`abbigliamento:${lastObs.attireScore}/100`);
          if (lastObs?.postureScore !== undefined) vScores.push(`postura:${lastObs.postureScore}/100`);
          visualNote = `[${lc.videoNote} — ${vDesc}${vScores.length > 0 ? ` (${vScores.join(", ")})` : ""}]`;
        } else {
          visualNote = `[${lc.videoFeed}]`;
        }

        let audioNote = "";
        if (audioObservations && audioObservations.length > 0) {
          const lastAudio = audioObservations[audioObservations.length - 1];
          const audioDetails: string[] = [];
          if (lastAudio.voiceToneScore !== undefined) audioDetails.push(`tono:${lastAudio.voiceToneScore}/100`);
          if (lastAudio.audioEnvironmentScore !== undefined) audioDetails.push(`ambiente:${lastAudio.audioEnvironmentScore}/100`);
          if (lastAudio.multipleVoices) audioDetails.push("⚠️ VOCI MULTIPLE");
          if (lastAudio.audioNotes) audioDetails.push(lastAudio.audioNotes);
          audioNote = `\n[${lc.audioNote} — ${audioDetails.join(", ")}]`;
        }

        const contextNote = `${visualNote}${audioNote}\n\n${lc.candidateSays}: ${m.content}`;
        geminiMessages.push({ role: "user", parts: [{ text: contextNote }] });
      } else {
        geminiMessages.push({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        });
      }
    }

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
      contents: geminiMessages,
      config: { maxOutputTokens: 2048, temperature: 0.15 },
    });

    const cleanForSpeech = (t: string): string => {
      let c = t;
      c = c.replace(/\*\*([^*]+)\*\*/g, "$1");
      c = c.replace(/\*([^*]+)\*/g, "$1");
      c = c.replace(/\*/g, "");
      c = c.replace(/__([^_]+)__/g, "$1");
      c = c.replace(/_([^_]+)_/g, "$1");
      c = c.replace(/`([^`]+)`/g, "$1");
      c = c.replace(/`/g, "");
      c = c.replace(/^#{1,6}\s+/gm, "");
      c = c.replace(/^-{3,}$/gm, "");
      c = c.replace(/^\s*[-*•]\s+/gm, "");
      c = c.replace(/^\s*\d+\.\s+/gm, "");
      c = c.replace(/\([^)]*(?:pausa|tono|sorride|ride|serio)[^)]*\)/gi, "");
      c = c.replace(/[[\]<>{}()]/g, "");
      c = c.replace(/"/g, "");
      c = c.replace(/\//g, " ");
      c = c.replace(/\[END_INTERVIEW\]/g, "");
      return c;
    };

    let fullResponse = "";
    let rawFullResponse = "";
    let questionSent = false;
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        rawFullResponse += text;
      }
      if (text && !questionSent) {
        const cleaned = cleanForSpeech(text);
        if (cleaned) {
          fullResponse += cleaned;
          const qIdx = fullResponse.indexOf("?");
          if (qIdx !== -1) {
            const afterQ = fullResponse.substring(qIdx + 1).trim();
            if (afterQ.length > 10) {
              const upToQ = fullResponse.substring(0, qIdx + 1);
              const alreadySent = fullResponse.length - cleaned.length;
              const remaining = upToQ.substring(alreadySent);
              if (remaining) {
                res.write(`data: ${JSON.stringify({ content: remaining })}\n\n`);
              }
              questionSent = true;
            } else {
              res.write(`data: ${JSON.stringify({ content: cleaned })}\n\n`);
            }
          } else {
            res.write(`data: ${JSON.stringify({ content: cleaned })}\n\n`);
          }
        }
      }
    }

    if (fullResponse.trim() && !fullResponse.trim().endsWith("?") && !questionSent) {
      res.write(`data: ${JSON.stringify({ content: "?" })}\n\n`);
    }

    const hasEndSignal = rawFullResponse.includes("[END_INTERVIEW]");

    const endInterview = hasEndSignal;

    res.write(`data: ${JSON.stringify({ done: true, endInterview })}\n\n`);
    res.end();
  } catch (err) {
    logger.error({ err }, "Harid AI chat error");
    if (!res.headersSent) {
      res.status(500).json({ error: "Errore IA" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Errore IA" })}\n\n`);
      res.end();
    }
  }
});

export default router;
