import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { candidatesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logger } from "../lib/logger.js";

const JWT_SECRET = process.env.JWT_SECRET || "video-interview-secret-key-2024";
const router: IRouter = Router();

router.post("/candidate-auth/register", async (req, res) => {
  try {
    const { email, password, name, phone, cvText, cvFileName } = req.body as {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
      cvText?: string;
      cvFileName?: string;
    };

    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password e nome sono obbligatori" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "La password deve avere almeno 6 caratteri" });
      return;
    }

    const existing = await db.select().from(candidatesTable).where(eq(candidatesTable.email, email.toLowerCase().trim()));
    if (existing.length > 0) {
      res.status(409).json({ error: "Esiste già un account con questa email" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [candidate] = await db.insert(candidatesTable).values({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      phone: phone?.trim() || null,
      cvText: cvText || null,
      cvFileName: cvFileName || null,
    }).returning();

    const token = jwt.sign(
      { id: candidate.id, email: candidate.email, name: candidate.name, type: "candidate" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      candidate: { id: candidate.id, email: candidate.email, name: candidate.name, phone: candidate.phone, cvFileName: candidate.cvFileName },
    });
  } catch (err) {
    logger.error({ err }, "Candidate register error");
    res.status(500).json({ error: "Errore interno del server" });
  }
});

router.post("/candidate-auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: "Email e password sono obbligatori" });
      return;
    }

    const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.email, email.toLowerCase().trim()));
    if (!candidate) {
      res.status(401).json({ error: "Credenziali non valide" });
      return;
    }

    const valid = await bcrypt.compare(password, candidate.password);
    if (!valid) {
      res.status(401).json({ error: "Credenziali non valide" });
      return;
    }

    const token = jwt.sign(
      { id: candidate.id, email: candidate.email, name: candidate.name, type: "candidate" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      candidate: { id: candidate.id, email: candidate.email, name: candidate.name, phone: candidate.phone, cvFileName: candidate.cvFileName },
    });
  } catch (err) {
    logger.error({ err }, "Candidate login error");
    res.status(500).json({ error: "Errore interno del server" });
  }
});

router.get("/candidate-auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Non autenticato" });
      return;
    }

    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { id: number; type?: string };
    if (decoded.type !== "candidate") {
      res.status(401).json({ error: "Token non valido per candidati" });
      return;
    }

    const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, decoded.id));
    if (!candidate) {
      res.status(404).json({ error: "Candidato non trovato" });
      return;
    }

    res.json({
      id: candidate.id,
      email: candidate.email,
      name: candidate.name,
      phone: candidate.phone,
      cvFileName: candidate.cvFileName,
      hasCv: !!candidate.cvText,
    });
  } catch {
    res.status(401).json({ error: "Token non valido o scaduto" });
  }
});

router.put("/candidate-auth/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Non autenticato" });
      return;
    }

    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { id: number; type?: string };
    if (decoded.type !== "candidate") {
      res.status(401).json({ error: "Token non valido" });
      return;
    }

    const { name, phone, cvText, cvFileName } = req.body as { name?: string; phone?: string; cvText?: string; cvFileName?: string };
    const updates: Record<string, unknown> = {};
    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (cvText !== undefined) updates.cvText = cvText;
    if (cvFileName !== undefined) updates.cvFileName = cvFileName;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Nessun dato da aggiornare" });
      return;
    }

    const [updated] = await db.update(candidatesTable).set(updates).where(eq(candidatesTable.id, decoded.id)).returning();
    res.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      cvFileName: updated.cvFileName,
      hasCv: !!updated.cvText,
    });
  } catch {
    res.status(401).json({ error: "Token non valido o scaduto" });
  }
});

router.get("/candidate/applications", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Non autenticato" });
      return;
    }

    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { id: number; type?: string };
    if (decoded.type !== "candidate") {
      res.status(401).json({ error: "Token non valido" });
      return;
    }

    const { interviewsTable, positionsTable } = await import("@workspace/db/schema");

    const interviews = await db
      .select({
        id: interviewsTable.id,
        positionId: interviewsTable.positionId,
        totalScore: interviewsTable.totalScore,
        pipelineStatus: interviewsTable.pipelineStatus,
        status: interviewsTable.status,
        createdAt: interviewsTable.createdAt,
        positionTitle: positionsTable.title,
      })
      .from(interviewsTable)
      .leftJoin(positionsTable, eq(interviewsTable.positionId, positionsTable.id))
      .where(eq(interviewsTable.candidateId, decoded.id))
      .orderBy(interviewsTable.createdAt);

    res.json(interviews.map(i => ({ ...i, positionTitle: i.positionTitle ?? "Sconosciuta" })));
  } catch {
    res.status(401).json({ error: "Token non valido o scaduto" });
  }
});

router.get("/candidate/cv-text", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Non autenticato" });
      return;
    }

    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { id: number; type?: string };
    if (decoded.type !== "candidate") {
      res.status(401).json({ error: "Token non valido" });
      return;
    }

    const [candidate] = await db.select({ cvText: candidatesTable.cvText }).from(candidatesTable).where(eq(candidatesTable.id, decoded.id));
    res.json({ cvText: candidate?.cvText || "" });
  } catch {
    res.status(401).json({ error: "Token non valido o scaduto" });
  }
});

export default router;
