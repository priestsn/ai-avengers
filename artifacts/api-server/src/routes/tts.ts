import { Router } from "express";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { logger } from "../lib/logger.js";

const router = Router();

const TTS_VOICES: Record<string, string> = {
  it: "it-IT-DiegoNeural",
  en: "en-US-GuyNeural",
  es: "es-ES-AlvaroNeural",
  zh: "zh-CN-YunxiNeural",
};

router.post("/tts", async (req, res) => {
  try {
    const { text, lang } = req.body as { text?: string; lang?: string };
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    const clean = text.trim().slice(0, 2000);
    const voice = TTS_VOICES[lang || "it"] || TTS_VOICES.it;

    const tts = new MsEdgeTTS();
    await tts.setMetadata(
      voice,
      OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3
    );

    const { audioStream } = tts.toStream(clean);

    const chunks: Buffer[] = [];
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        logger.error({ voice, textLen: clean.length }, "TTS timeout after 15s");
        if (!res.headersSent) {
          res.status(504).json({ error: "TTS generation timed out" });
        }
        try { audioStream.destroy(); } catch {}
      }
    }, 15000);

    audioStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    audioStream.on("end", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      const buffer = Buffer.concat(chunks);
      logger.info({ voice, textLen: clean.length, audioBytes: buffer.length }, "TTS generated");

      if (buffer.length === 0) {
        logger.error({ voice, textLen: clean.length }, "TTS returned empty audio");
        if (!res.headersSent) {
          res.status(500).json({ error: "TTS returned empty audio" });
        }
        return;
      }

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", buffer.length.toString());
      res.setHeader("Cache-Control", "no-cache");
      res.end(buffer);
    });

    audioStream.on("error", (err: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      logger.error({ err: err.message, voice }, "TTS stream error");
      if (!res.headersSent) {
        res.status(500).json({ error: "TTS generation failed", detail: err.message });
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err: msg }, "TTS catch error");
    if (!res.headersSent) {
      res.status(500).json({ error: "TTS service error", detail: msg });
    }
  }
});

export default router;
