import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { hrUsersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { LoginHRBody } from "@workspace/api-zod";
import { JWT_SECRET, requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const parsed = LoginHRBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const { email, password } = parsed.data;

    const users = await db.select().from(hrUsersTable).where(eq(hrUsersTable.email, email));
    const user = users[0];

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/me", requireAuth, (req: AuthRequest, res) => {
  res.json(req.hrUser);
});

export default router;
