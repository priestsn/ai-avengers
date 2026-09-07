import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import candidateAuthRouter from "./candidate-auth.js";
import positionsRouter from "./positions.js";
import interviewsRouter from "./interviews.js";
import haridRouter from "./harid.js";
import evaluateRouter from "./evaluate.js";
import ttsRouter from "./tts.js";
import feedbackRouter from "./feedback.js";
import cvUploadRouter from "./cv-upload.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(candidateAuthRouter);
router.use(positionsRouter);
router.use(interviewsRouter);
router.use(haridRouter);
router.use(evaluateRouter);
router.use(ttsRouter);
router.use(feedbackRouter);
router.use(cvUploadRouter);

export default router;
