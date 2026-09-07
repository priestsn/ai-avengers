import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { createRequire } from "node:module";
import { logger } from "../lib/logger.js";

type PdfParseFn = (buf: Buffer) => Promise<{ text: string; numpages: number }>;

let pdfParse: PdfParseFn | null = null;
try {
  const _require = createRequire(import.meta.url);
  const loaded = _require("pdf-parse");
  if (typeof loaded === "function") {
    pdfParse = loaded;
    logger.info("pdf-parse loaded successfully (CJS function)");
  } else if (typeof loaded?.default === "function") {
    pdfParse = loaded.default;
    logger.info("pdf-parse loaded via default export");
  } else {
    logger.error({ loadedType: typeof loaded, keys: Object.keys(loaded ?? {}) }, "pdf-parse loaded but not callable");
  }
} catch (initErr) {
  logger.error({ err: initErr }, "Failed to load pdf-parse module");
}

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Solo file PDF sono accettati"));
    }
  },
});

router.post("/cv-upload", upload.single("cv"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Nessun file caricato" });
      return;
    }

    logger.info({ fileSize: req.file.size, mimetype: req.file.mimetype }, "CV upload received");

    if (!pdfParse) {
      logger.error("pdf-parse module not available at request time");
      res.status(500).json({ error: "Modulo di parsing PDF non disponibile. Contattare il supporto tecnico." });
      return;
    }

    const data = await pdfParse(req.file.buffer);
    logger.info({ pages: data.numpages, textLength: data.text?.length ?? 0 }, "PDF parsed successfully");

    const text = data.text
      .replace(/\s{3,}/g, "\n")
      .replace(/\n{4,}/g, "\n\n")
      .trim()
      .slice(0, 8000);

    if (!text || text.length < 5) {
      res.status(422).json({ error: "Impossibile estrarre testo dal PDF. Il file potrebbe essere un'immagine scansionata o protetto." });
      return;
    }

    res.json({ text, pages: data.numpages });
  } catch (err) {
    const msg = (err as Error)?.message ?? "";
    logger.error({ err, message: msg, stack: (err as Error)?.stack }, "CV upload error");
    const errorMessage = msg.includes("password") || msg.includes("Password")
      ? "Il PDF è protetto da password. Carica un PDF non protetto."
      : msg.includes("Invalid") || msg.includes("invalid")
        ? "Il file PDF sembra corrotto o non valido. Prova con un altro file."
        : "Errore durante l'elaborazione del CV. Verifica che il file sia un PDF valido.";
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
