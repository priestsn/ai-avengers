import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "video-interview-secret-key-2024";

export interface AuthRequest extends Request {
  hrUser?: { id: number; email: string; name: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; name: string; type?: string };
    if (decoded.type === "candidate") {
      res.status(403).json({ error: "Access denied — HR credentials required" });
      return;
    }
    req.hrUser = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export { JWT_SECRET };
