import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { interviewsTable, positionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateInterviewBody, GetInterviewParams, DeleteInterviewParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/interviews", requireAuth, async (req, res) => {
  try {
    const interviews = await db
      .select({
        id: interviewsTable.id,
        positionId: interviewsTable.positionId,
        candidateId: interviewsTable.candidateId,
        candidateName: interviewsTable.candidateName,
        candidateEmail: interviewsTable.candidateEmail,
        preAnswers: interviewsTable.preAnswers,
        totalScore: interviewsTable.totalScore,
        skillsScore: interviewsTable.skillsScore,
        speechScore: interviewsTable.speechScore,
        confidenceScore: interviewsTable.confidenceScore,
        fillerWordCount: interviewsTable.fillerWordCount,
        wordCount: interviewsTable.wordCount,
        aiAnalysis: interviewsTable.aiAnalysis,
        status: interviewsTable.status,
        pipelineStatus: interviewsTable.pipelineStatus,
        createdAt: interviewsTable.createdAt,
        positionTitle: positionsTable.title,
      })
      .from(interviewsTable)
      .leftJoin(positionsTable, eq(interviewsTable.positionId, positionsTable.id))
      .orderBy(interviewsTable.createdAt);

    const result = interviews.map((i) => ({
      ...i,
      positionTitle: i.positionTitle ?? "Unknown",
      preAnswers: (() => { try { return JSON.parse(i.preAnswers); } catch { return {}; } })(),
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "List interviews error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/interviews/:id", requireAuth, async (req, res) => {
  try {
    const parsed = GetInterviewParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid interview ID" });
      return;
    }

    const interviews = await db
      .select({
        id: interviewsTable.id,
        positionId: interviewsTable.positionId,
        candidateId: interviewsTable.candidateId,
        candidateName: interviewsTable.candidateName,
        candidateEmail: interviewsTable.candidateEmail,
        preAnswers: interviewsTable.preAnswers,
        totalScore: interviewsTable.totalScore,
        skillsScore: interviewsTable.skillsScore,
        speechScore: interviewsTable.speechScore,
        confidenceScore: interviewsTable.confidenceScore,
        fillerWordCount: interviewsTable.fillerWordCount,
        wordCount: interviewsTable.wordCount,
        aiAnalysis: interviewsTable.aiAnalysis,
        status: interviewsTable.status,
        pipelineStatus: interviewsTable.pipelineStatus,
        createdAt: interviewsTable.createdAt,
        positionTitle: positionsTable.title,
      })
      .from(interviewsTable)
      .leftJoin(positionsTable, eq(interviewsTable.positionId, positionsTable.id))
      .where(eq(interviewsTable.id, parsed.data.id));

    const interview = interviews[0];
    if (!interview) {
      res.status(404).json({ error: "Interview not found" });
      return;
    }

    res.json({
      ...interview,
      positionTitle: interview.positionTitle ?? "Unknown",
      preAnswers: (() => { try { return JSON.parse(interview.preAnswers); } catch { return {}; } })(),
    });
  } catch (err) {
    req.log.error({ err }, "Get interview error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/interviews", async (req, res) => {
  try {
    const parsed = CreateInterviewBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { positionId, candidateName, candidateEmail, preAnswers, totalScore, skillsScore, speechScore, confidenceScore, fillerWordCount, wordCount, aiAnalysis } = parsed.data;

    let candidateId: number | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const jwt = await import("jsonwebtoken");
        const decoded = jwt.default.verify(authHeader.slice(7), process.env.JWT_SECRET || "video-interview-secret-key-2024") as { id: number; type?: string };
        if (decoded.type === "candidate" && decoded.id) {
          candidateId = decoded.id;
        }
      } catch { /* no valid candidate token — candidateId stays null */ }
    }

    let cappedTotal = totalScore;
    let cappedSkills = skillsScore;
    let cappedSpeech = speechScore;
    let cappedConfidence = confidenceScore;
    if (aiAnalysis) {
      try {
        const parsed2 = JSON.parse(aiAnalysis);
        if (parsed2.deviceMode === "keyboard-only" || parsed2.scoreCapped === true) {
          const CAP = 60;
          cappedTotal = Math.min(CAP, totalScore);
          cappedSkills = Math.min(CAP, skillsScore);
          cappedSpeech = Math.min(CAP, speechScore);
          cappedConfidence = Math.min(CAP, confidenceScore);
        }
      } catch { /* ignore parse errors */ }
    }

    const [interview] = await db.insert(interviewsTable).values({
      positionId,
      candidateId: candidateId ?? null,
      candidateName,
      candidateEmail,
      preAnswers: JSON.stringify(preAnswers ?? {}),
      totalScore: cappedTotal,
      skillsScore: cappedSkills,
      speechScore: cappedSpeech,
      confidenceScore: cappedConfidence,
      fillerWordCount: fillerWordCount ?? 0,
      wordCount: wordCount ?? 0,
      aiAnalysis: aiAnalysis ?? null,
      status: "completed",
      pipelineStatus: "completato",
    }).returning();

    res.status(201).json({
      ...interview,
      preAnswers: (() => { try { return JSON.parse(interview.preAnswers); } catch { return {}; } })(),
    });
  } catch (err) {
    req.log.error({ err }, "Create interview error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/interviews/:id/pipeline-status", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json({ error: "Invalid interview ID" });
      return;
    }

    const { pipelineStatus } = req.body as { pipelineStatus?: string };
    const validStatuses = ["completato", "in_valutazione", "secondo_colloquio", "proposta", "assunto", "rifiutato"];
    if (!pipelineStatus || !validStatuses.includes(pipelineStatus)) {
      res.status(400).json({ error: "Stato non valido", validStatuses });
      return;
    }

    const [updated] = await db
      .update(interviewsTable)
      .set({ pipelineStatus })
      .where(eq(interviewsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Interview not found" });
      return;
    }

    res.json({ success: true, pipelineStatus: updated.pipelineStatus });
  } catch (err) {
    req.log.error({ err }, "Update pipeline status error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/interviews/:id", requireAuth, async (req, res) => {
  try {
    const parsed = DeleteInterviewParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid interview ID" });
      return;
    }

    await db.delete(interviewsTable).where(eq(interviewsTable.id, parsed.data.id));
    res.json({ success: true, message: "Interview deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete interview error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
