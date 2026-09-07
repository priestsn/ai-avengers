import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { positionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreatePositionBody, GetPositionParams, DeletePositionParams, UpdatePositionBody, UpdatePositionParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

function formatPosition(p: typeof positionsTable.$inferSelect) {
  return {
    ...p,
    questions: JSON.parse(p.questions) as string[],
  };
}

router.get("/positions", async (req, res) => {
  try {
    const positions = await db.select().from(positionsTable).orderBy(positionsTable.createdAt);
    const result = positions.map(formatPosition);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "List positions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/positions/:id", async (req, res) => {
  try {
    const parsed = GetPositionParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid position ID" });
      return;
    }

    const positions = await db.select().from(positionsTable).where(eq(positionsTable.id, parsed.data.id));
    const position = positions[0];

    if (!position) {
      res.status(404).json({ error: "Position not found" });
      return;
    }

    res.json(formatPosition(position));
  } catch (err) {
    req.log.error({ err }, "Get position error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/positions", requireAuth, async (req, res) => {
  try {
    const parsed = CreatePositionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { title, description, techStack, questions, companyName, companyLogoUrl, location, workMode, employmentType, minRequirements, educationLevel, salaryRange, benefits } = parsed.data;
    const [position] = await db.insert(positionsTable).values({
      title,
      description,
      techStack,
      questions: JSON.stringify(questions),
      companyName: companyName ?? null,
      companyLogoUrl: companyLogoUrl ?? null,
      location: location ?? null,
      workMode: workMode ?? null,
      employmentType: employmentType ?? null,
      minRequirements: minRequirements ?? null,
      educationLevel: educationLevel ?? null,
      salaryRange: salaryRange ?? null,
      benefits: benefits ?? null,
    }).returning();

    res.status(201).json(formatPosition(position));
  } catch (err) {
    req.log.error({ err }, "Create position error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/positions/:id", requireAuth, async (req, res) => {
  try {
    const paramsParsed = UpdatePositionParams.safeParse({ id: Number(req.params.id) });
    if (!paramsParsed.success) {
      res.status(400).json({ error: "Invalid position ID" });
      return;
    }

    const bodyParsed = UpdatePositionBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const updateData: Record<string, unknown> = {};
    const d = bodyParsed.data;
    if (d.title !== undefined) updateData.title = d.title;
    if (d.description !== undefined) updateData.description = d.description;
    if (d.techStack !== undefined) updateData.techStack = d.techStack;
    if (d.questions !== undefined) updateData.questions = JSON.stringify(d.questions);
    if (d.companyName !== undefined) updateData.companyName = d.companyName;
    if (d.companyLogoUrl !== undefined) updateData.companyLogoUrl = d.companyLogoUrl;
    if (d.location !== undefined) updateData.location = d.location;
    if (d.workMode !== undefined) updateData.workMode = d.workMode;
    if (d.employmentType !== undefined) updateData.employmentType = d.employmentType;
    if (d.minRequirements !== undefined) updateData.minRequirements = d.minRequirements;
    if (d.educationLevel !== undefined) updateData.educationLevel = d.educationLevel;
    if (d.salaryRange !== undefined) updateData.salaryRange = d.salaryRange;
    if (d.benefits !== undefined) updateData.benefits = d.benefits;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const [updated] = await db
      .update(positionsTable)
      .set(updateData)
      .where(eq(positionsTable.id, paramsParsed.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Position not found" });
      return;
    }

    res.json(formatPosition(updated));
  } catch (err) {
    req.log.error({ err }, "Update position error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/positions/:id", requireAuth, async (req, res) => {
  try {
    const parsed = DeletePositionParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid position ID" });
      return;
    }

    await db.delete(positionsTable).where(eq(positionsTable.id, parsed.data.id));
    res.json({ success: true, message: "Position deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete position error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
