import { Router, type IRouter } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface EvaluationResult {
  skillsScore: number;
  speechScore: number;
  confidenceScore: number;
  totalScore: number;
  recommendation: "consigliato" | "da valutare" | "non consigliato";
  skillsAnalysis: string;
  speechAnalysis: string;
  confidenceAnalysis: string;
  presentationAnalysis: string;
  strengths: string[];
  weaknesses: string[];
  overallSummary: string;
  conversationSummary: string;
}

router.post("/harid/evaluate", async (req, res) => {
  try {
    const { conversation, positionTitle, positionDescription, techStack, candidateName, visualObservations, audioObservations, lang, companyName, location, workMode, employmentType, minRequirements, educationLevel } =
      req.body as {
        conversation: Message[];
        positionTitle: string;
        positionDescription: string;
        techStack: string;
        candidateName: string;
        visualObservations?: Array<{ score: number; issues: string[]; notes: string; visualDescription?: string; expressionScore?: number; gestureScore?: number; attireScore?: number; backgroundScore?: number; postureScore?: number; appearanceScore?: number }>;
        audioObservations?: Array<{ audioEnvironmentScore?: number; voiceToneScore?: number; multipleVoices?: boolean; multipleVoicesDetail?: string; audioTranscription?: string; audioNotes?: string }>;
        lang?: string;
        companyName?: string;
        location?: string;
        workMode?: string;
        employmentType?: string;
        minRequirements?: string;
        educationLevel?: string;
      };

    const evalLang = lang === "en" ? "English" : lang === "es" ? "Spanish" : lang === "zh" ? "Mandarin Chinese" : "Italian";

    if (!conversation || !Array.isArray(conversation) || conversation.length === 0) {
      res.status(400).json({ error: "Conversation required" });
      return;
    }

    const conversationText = conversation
      .map((m) => `[${m.role === "assistant" ? "HARID AI" : "CANDIDATO"}]: ${m.content}`)
      .join("\n\n");

    const candidateMessages = conversation.filter((m) => m.role === "user");
    const totalExchanges = candidateMessages.length;

    const visualBlock = (() => {
      if (!visualObservations || !Array.isArray(visualObservations) || visualObservations.length === 0) return "";
      const sanitized = visualObservations
        .filter((o): o is Record<string, unknown> => o && typeof o === "object")
        .map((o) => ({
          score: Math.max(0, Math.min(100, Number(o.score) || 0)),
          issues: Array.isArray(o.issues) ? o.issues.filter((i): i is string => typeof i === "string") : [],
          visualDescription: typeof o.visualDescription === "string" ? o.visualDescription : undefined,
          expressionScore: typeof o.expressionScore === "number" && isFinite(o.expressionScore) ? o.expressionScore : undefined,
          gestureScore: typeof o.gestureScore === "number" && isFinite(o.gestureScore) ? o.gestureScore : undefined,
          attireScore: typeof o.attireScore === "number" && isFinite(o.attireScore) ? o.attireScore : undefined,
          backgroundScore: typeof o.backgroundScore === "number" && isFinite(o.backgroundScore) ? o.backgroundScore : undefined,
          postureScore: typeof o.postureScore === "number" && isFinite(o.postureScore) ? o.postureScore : undefined,
          appearanceScore: typeof o.appearanceScore === "number" && isFinite(o.appearanceScore) ? o.appearanceScore : undefined,
        }));
      if (sanitized.length === 0) return "";
      const avgScore = Math.round(sanitized.reduce((s, o) => s + o.score, 0) / sanitized.length);
      const allIssues = sanitized.flatMap((o) => o.issues).filter((v, i, a) => a.indexOf(v) === i);
      const descriptions = sanitized.filter((o) => o.visualDescription).map((o) => o.visualDescription).slice(-5);
      const avgSub = (key: string) => {
        const vals = sanitized.filter((o) => (o as Record<string, unknown>)[key] !== undefined).map((o) => Number((o as Record<string, unknown>)[key]));
        return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      };
      const exprAvg = avgSub("expressionScore");
      const gestAvg = avgSub("gestureScore");
      const attAvg = avgSub("attireScore");
      const bgAvg = avgSub("backgroundScore");
      const postAvg = avgSub("postureScore");
      const appAvg = avgSub("appearanceScore");

      return `
═══════════════════════════════════
ANALISI VISIVA DALLA WEBCAM (${sanitized.length} osservazioni durante il colloquio)
═══════════════════════════════════
Punteggio visivo medio: ${avgScore}/100
${exprAvg !== null ? `Espressione facciale media: ${exprAvg}/100` : ""}
${gestAvg !== null ? `Gesti e mani media: ${gestAvg}/100` : ""}
${attAvg !== null ? `Abbigliamento media: ${attAvg}/100` : ""}
${bgAvg !== null ? `Sfondo media: ${bgAvg}/100` : ""}
${postAvg !== null ? `Postura media: ${postAvg}/100` : ""}
${appAvg !== null ? `Aspetto fisico media: ${appAvg}/100` : ""}
${allIssues.length > 0 ? `Problemi rilevati: ${allIssues.join("; ")}` : "Nessun problema visivo rilevato."}
${descriptions.length > 0 ? `Descrizioni visive:\n${descriptions.map((d) => `- ${d}`).join("\n")}` : ""}
═══════════════════════════════════
`;
    })();

    const audioBlock = (() => {
      if (!audioObservations || !Array.isArray(audioObservations) || audioObservations.length === 0) return "";
      const sanitized = audioObservations.filter((o): o is Record<string, unknown> => o && typeof o === "object");
      if (sanitized.length === 0) return "";
      const avgTone = (key: string) => {
        const vals = sanitized.filter((o) => typeof o[key] === "number").map((o) => Number(o[key]));
        return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      };
      const toneAvg = avgTone("voiceToneScore");
      const envAvg = avgTone("audioEnvironmentScore");
      const multipleVoicesDetected = sanitized.some((o) => Boolean(o.multipleVoices));
      const voiceDetails = sanitized.filter((o) => o.multipleVoicesDetail).map((o) => String(o.multipleVoicesDetail));
      const audioNotes = sanitized.filter((o) => o.audioNotes).map((o) => String(o.audioNotes)).slice(-3);
      const transcriptions = sanitized.filter((o) => o.audioTranscription).map((o) => String(o.audioTranscription)).slice(-5);

      return `
═══════════════════════════════════
ANALISI AUDIO DAL MICROFONO (${sanitized.length} campioni durante il colloquio)
═══════════════════════════════════
${toneAvg !== null ? `Tono di voce medio: ${toneAvg}/100` : ""}
${envAvg !== null ? `Qualità ambiente sonoro medio: ${envAvg}/100` : ""}
${multipleVoicesDetected ? `⚠️ VOCI MULTIPLE RILEVATE: ${voiceDetails.join("; ") || "Più di una voce rilevata durante il colloquio"}` : "Nessuna voce esterna rilevata."}
${audioNotes.length > 0 ? `Note audio:\n${audioNotes.map((n) => `- ${n}`).join("\n")}` : ""}
${transcriptions.length > 0 ? `Trascrizioni audio AI (più accurate della trascrizione browser):\n${transcriptions.map((t) => `- ${t}`).join("\n")}` : ""}
═══════════════════════════════════
`;
    })();

    const evaluationPrompt = `Sei un Senior HR Analyst esperto e SEVERO in selezione del personale. Devi analizzare la seguente trascrizione COMPLETA di un colloquio di lavoro e fornire una valutazione ACCURATA e ONESTA basata ESCLUSIVAMENTE su ciò che è realmente successo nel colloquio.
IMPORTANTE: Il colloquio è stato condotto in ${evalLang}. Scrivi TUTTA la tua analisi (skillsAnalysis, speechAnalysis, confidenceAnalysis, presentationAnalysis, strengths, weaknesses, overallSummary, conversationSummary) in italiano per il team HR.

POSIZIONE: ${positionTitle}
DESCRIZIONE RUOLO: ${positionDescription}
${companyName ? `AZIENDA: ${companyName}` : ""}
${location ? `SEDE: ${location}` : ""}
${workMode ? `MODALITÀ DI LAVORO: ${workMode}` : ""}
${employmentType ? `TIPO CONTRATTO: ${employmentType}` : ""}
${minRequirements ? `REQUISITI MINIMI RICHIESTI: ${minRequirements}` : ""}
${educationLevel ? `FORMAZIONE RICHIESTA: ${educationLevel}` : ""}
COMPETENZE/SETTORE RICHIESTO: ${techStack}
CANDIDATO: ${candidateName}
NUMERO SCAMBI CANDIDATO: ${totalExchanges}

═══════════════════════════════════
TRASCRIZIONE COMPLETA DEL COLLOQUIO
═══════════════════════════════════
${conversationText}
═══════════════════════════════════
${visualBlock}${audioBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGOLE DI VALUTAZIONE FONDAMENTALI
━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ REGOLA ZERO — COMPORTAMENTO INAPPROPRIATO (PUNTEGGIO 0-5):
Se il candidato ha:
- Bestemmiato, insultato, usato volgarità → TUTTI i punteggi a 0-5, recommendation "non consigliato"
- Dato risposte sarcastiche, derisorie, offensive → TUTTI i punteggi a 0-10
- Chiuso la conversazione subito senza rispondere → TUTTI i punteggi a 0-10
- Risposto con monosillabi o frasi irrilevanti per TUTTO il colloquio → punteggi massimi 15-20
In questi casi la conversationSummary deve descrivere ESATTAMENTE il comportamento inappropriato.

⚠️ REGOLA UNO — BASATI SOLO SU CIÒ CHE È EFFETTIVAMENTE SCRITTO:
- NON inventare competenze che il candidato non ha menzionato
- NON presumere che il candidato sappia cose che non ha detto
- NON dare punteggi medi "di default" — se il candidato non ha detto nulla di utile, il punteggio è BASSO

⚠️ REGOLA DUE — COLLOQUI BREVI:
- 0 risposte del candidato (non ha mai parlato) → massimo 5 punti per categoria
- 1 risposta generica → massimo 20-25 punti
- 2-3 risposte anche brevi ma pertinenti → valuta normalmente in base al contenuto, NON penalizzare solo per la brevità
- Il colloquio potrebbe essere stato breve per TIMEOUT (tempo scaduto), non per colpa del candidato. Se ci sono risposte sostanziali, valutale equamente anche se sono poche.
- IMPORTANTE: Un colloquio breve con risposte BUONE vale più di un colloquio lungo con risposte VUOTE.

⚠️ REGOLA TRE — TOLLERANZA ERRORI TRASCRIZIONE:
- La trascrizione è generata AUTOMATICAMENTE dal browser (Speech Recognition) e può contenere errori significativi.
- Parole storpiate, frasi troncate, ripetizioni involontarie, parole senza senso isolate sono ERRORI DI TRASCRIZIONE, non del candidato.
- Valuta l'INTENTO comunicativo complessivo, non la perfezione testuale.
- Se l'analisi audio è disponibile, usa le informazioni sul tono di voce per compensare le imprecisioni della trascrizione.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITERI DI VALUTAZIONE DETTAGLIATI

1. COMPETENZE (skillsScore 0-100, peso 60%):
   - Il candidato ha dimostrato conoscenza CONCRETA e VERIFICABILE del settore/ruolo?
   - Ha fornito ESEMPI SPECIFICI con numeri, progetti, risultati?
   - Le risposte sono allineate con "${techStack}"?
   - 0-15: Nessuna competenza dimostrata, risposte vuote o irrilevanti
   - 16-35: Risposte generiche senza esempi concreti
   - 36-55: Competenze parziali, qualche esempio ma poco specifico
   - 56-75: Buone competenze con esempi concreti
   - 76-100: Competenze eccellenti con esempi misurabili e dettagliati

2. COMUNICAZIONE (speechScore 0-100, peso 25%):
   - Le risposte erano chiare, strutturate e pertinenti alla domanda?
   - Ha risposto DAVVERO alle domande o le ha evitate?
   - 0-15: Non ha risposto, ha detto assurdità, volgarità o monosillabi
   - 16-35: Risposte evasive, off-topic, molto confuse
   - 36-55: Comunicazione accettabile ma non strutturata
   - 56-75: Comunicazione chiara e organizzata
   - 76-100: Comunicazione eccellente, fluida e professionale

3. MOTIVAZIONE E FIT (confidenceScore 0-100, peso 15%):
   - Ha dimostrato interesse GENUINO e SPECIFICO per il ruolo?
   - 0-15: Nessuna motivazione, disinteresse totale o comportamento ostile
   - 16-35: Motivazione generica o assente
   - 36-55: Qualche interesse ma senza profondità
   - 56-75: Buona motivazione con ragioni specifiche
   - 76-100: Motivazione eccellente e profonda

━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO RISPOSTA (JSON)

Il totalScore DEVE essere calcolato come: round(skillsScore * 0.6 + speechScore * 0.25 + confidenceScore * 0.15)
La recommendation DEVE seguire il totalScore: >= 70 "consigliato", 40-69 "da valutare", < 40 "non consigliato"

CAMPI OBBLIGATORI:
- skillsAnalysis: Analisi dettagliata (2-4 frasi) delle competenze dimostrate o mancanti, con riferimenti a ciò che il candidato ha DETTO
- speechAnalysis: Analisi dettagliata (2-4 frasi) della comunicazione, citando comportamenti specifici
- confidenceAnalysis: Analisi dettagliata (2-4 frasi) della motivazione e del fit
- presentationAnalysis: Analisi VISIVA DETTAGLIATA (3-5 frasi) basata sulle osservazioni della webcam. Descrivi l'aspetto del candidato, cosa indossava, com'era lo sfondo, la postura durante il colloquio, eventuali comportamenti inappropriati osservati visivamente. Se non ci sono dati visivi, scrivi "Analisi visiva non disponibile per questo colloquio." Se la posizione richiede specifici standard visivi (es. modello, ruolo formale), commenta se il candidato li soddisfa.
- strengths: Array di punti di forza REALI emersi dal colloquio (vuoto se non ce ne sono)
- weaknesses: Array di punti deboli REALI emersi dal colloquio
- overallSummary: Riassunto per il team HR (3-5 frasi) con raccomandazione chiara. Se disponibili, includi anche note sull'aspetto visivo del candidato.
- conversationSummary: Riassunto FEDELE di ciò che è successo nel colloquio. Descrivi ogni scambio significativo: cosa ha chiesto Harid, cosa ha risposto il candidato. Se il candidato ha detto cose inappropriate, RIPORTALE. Questo è un VERBALE del colloquio per l'HR.

Rispondi SOLO con JSON valido. Nessun markdown. Nessun commento fuori dal JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: evaluationPrompt }] }],
      config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
    });

    const rawText = response.text ?? "";

    let evaluation: EvaluationResult;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      const parsed = JSON.parse(jsonMatch[0]);

      const skillsScore = Math.min(100, Math.max(0, Math.round(Number(parsed.skillsScore) || 0)));
      const speechScore = Math.min(100, Math.max(0, Math.round(Number(parsed.speechScore) || 0)));
      const confidenceScore = Math.min(100, Math.max(0, Math.round(Number(parsed.confidenceScore) || 0)));
      const totalScore = Math.round(skillsScore * 0.6 + speechScore * 0.25 + confidenceScore * 0.15);

      const rec = parsed.recommendation;
      const recommendation: EvaluationResult["recommendation"] =
        rec === "consigliato" || rec === "da valutare" || rec === "non consigliato"
          ? rec
          : totalScore >= 70 ? "consigliato" : totalScore >= 40 ? "da valutare" : "non consigliato";

      evaluation = {
        skillsScore,
        speechScore,
        confidenceScore,
        totalScore,
        recommendation,
        skillsAnalysis: String(parsed.skillsAnalysis || "Nessuna analisi disponibile."),
        speechAnalysis: String(parsed.speechAnalysis || "Nessuna analisi disponibile."),
        confidenceAnalysis: String(parsed.confidenceAnalysis || "Nessuna analisi disponibile."),
        presentationAnalysis: String(parsed.presentationAnalysis || "Analisi visiva non disponibile per questo colloquio."),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map(String) : [],
        overallSummary: String(parsed.overallSummary || "Nessun riassunto disponibile."),
        conversationSummary: String(parsed.conversationSummary || "Nessun verbale disponibile."),
      };
    } catch (parseErr) {
      logger.error({ parseErr, rawText }, "Failed to parse Gemini evaluation response");
      const fallbackSkills = Math.max(15, Math.min(40, totalExchanges * 10));
      const fallbackSpeech = Math.max(15, Math.min(40, totalExchanges * 10));
      const fallbackConfidence = Math.max(15, Math.min(35, totalExchanges * 8));
      const fallbackTotal = Math.round(fallbackSkills * 0.6 + fallbackSpeech * 0.25 + fallbackConfidence * 0.15);
      evaluation = {
        skillsScore: fallbackSkills,
        speechScore: fallbackSpeech,
        confidenceScore: fallbackConfidence,
        totalScore: fallbackTotal,
        recommendation: fallbackTotal >= 40 ? "da valutare" : "non consigliato",
        skillsAnalysis: "Valutazione automatica non disponibile a causa di un errore tecnico. Consultare la trascrizione.",
        speechAnalysis: "Valutazione automatica non disponibile.",
        confidenceAnalysis: "Valutazione automatica non disponibile.",
        presentationAnalysis: "Analisi visiva non disponibile per questo colloquio.",
        strengths: [],
        weaknesses: ["Valutazione IA non completata — punteggio basato su parametri base"],
        overallSummary: `Valutazione fallback: il candidato ha completato ${totalExchanges} scambi. Consultare la trascrizione per una valutazione manuale.`,
        conversationSummary: "Errore nella valutazione automatica. Consultare la trascrizione grezza.",
      };
      logger.warn({ totalExchanges, fallbackTotal }, "Using fallback evaluation scores");
    }

    if (evaluation.totalScore === 0 && totalExchanges >= 2) {
      logger.warn({ totalExchanges, evaluation }, "Zero score detected with real responses — applying minimum");
      const minSkills = Math.max(evaluation.skillsScore, 20);
      const minSpeech = Math.max(evaluation.speechScore, 20);
      const minConfidence = Math.max(evaluation.confidenceScore, 15);
      evaluation.skillsScore = minSkills;
      evaluation.speechScore = minSpeech;
      evaluation.confidenceScore = minConfidence;
      evaluation.totalScore = Math.round(minSkills * 0.6 + minSpeech * 0.25 + minConfidence * 0.15);
      evaluation.recommendation = evaluation.totalScore >= 40 ? "da valutare" : "non consigliato";
    }

    res.json(evaluation);
  } catch (err) {
    logger.error({ err }, "Harid evaluate error");
    res.status(500).json({ error: "Errore valutazione IA" });
  }
});

export default router;
