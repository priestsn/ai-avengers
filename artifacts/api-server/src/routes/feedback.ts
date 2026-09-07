import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { feedbackTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

router.post("/feedback", async (req, res) => {
  try {
    const { candidateName, candidateEmail, category, message, interviewId } =
      req.body as {
        candidateName: string;
        candidateEmail: string;
        category: string;
        message: string;
        interviewId?: number;
      };

    if (!candidateName || !candidateEmail || !message) {
      res.status(400).json({ error: "candidateName, candidateEmail, message required" });
      return;
    }

    const validCategories = ["audio", "video", "ai", "altro"];
    const cat = validCategories.includes(category) ? category : "altro";

    const [inserted] = await db
      .insert(feedbackTable)
      .values({
        candidateName,
        candidateEmail,
        category: cat,
        message: message.slice(0, 5000),
        interviewId: interviewId ?? null,
      })
      .returning();

    res.json(inserted);
  } catch (err) {
    console.error("Feedback insert error:", err);
    res.status(500).json({ error: "Errore nel salvataggio del feedback" });
  }
});

router.get("/feedback", requireAuth, async (_req, res) => {
  try {
    const items = await db
      .select()
      .from(feedbackTable)
      .orderBy(desc(feedbackTable.createdAt))
      .limit(100);

    res.json(items);
  } catch (err) {
    console.error("Feedback fetch error:", err);
    res.status(500).json({ error: "Errore nel recupero del feedback" });
  }
});

export default router;
