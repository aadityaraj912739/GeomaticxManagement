import crypto from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { AiInference, Project, User } from "../models/registry.js";
import { allow } from "../middleware/auth.js";
import { recordAudit } from "../services/audit.js";
import { aiConfig, runOpenAiInference } from "../services/openai.js";

const roles = ["ADMIN", "MANAGER", "SURVEYOR"];
const createSchema = z.object({
  projectId: z.string().uuid().nullish(),
  title: z.string().trim().min(3).max(255),
  useCase: z.enum(["GENERAL_ASSISTANCE", "SURVEY_SUMMARY", "DATA_QUALITY", "RISK_REVIEW", "DOCUMENT_EXTRACTION"]),
  prompt: z.string().trim().min(10),
  dataClassification: z.enum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"]),
  containsPersonalData: z.boolean().default(false)
});
const reviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().trim().max(4000).optional().default("")
});
const inferenceRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.AI_REQUESTS_PER_MINUTE || 10),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "AI request limit reached. Please try again shortly." }
});

const include = [
  { model: Project, attributes: ["id", "code", "name"] },
  { model: User, as: "requestedBy", attributes: ["id", "name", "role"] },
  { model: User, as: "reviewedBy", attributes: ["id", "name", "role"] }
];

const publicConfig = () => {
  const { configured, provider, model, maxPromptChars, selfApprovalAllowed } = aiConfig();
  return { configured, provider, model, maxPromptChars, selfApprovalAllowed };
};

export const aiRouter = Router();
aiRouter.use(allow(...roles));

aiRouter.get("/status", (_req, res) => res.json(publicConfig()));

aiRouter.get("/inferences", async (_req, res, next) => {
  try {
    res.json(await AiInference.findAll({ include, limit: 100, order: [["createdAt", "DESC"]] }));
  } catch (error) { next(error); }
});

aiRouter.get("/inferences/:id/output", async (req, res, next) => {
  try {
    const row = await AiInference.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "Inference not found" });
    if (row.status !== "APPROVED") return res.status(409).json({ message: "AI output has not been approved for release" });
    res.json({ id: row.id, title: row.title, responseText: row.responseText, modelName: row.modelName, approvedAt: row.reviewedAt });
  } catch (error) { next(error); }
});

aiRouter.post("/inferences", inferenceRateLimit, async (req, res, next) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues.map(issue => issue.message).join(", ") });
  const input = parsed.data;
  const config = aiConfig();
  if (input.prompt.length > config.maxPromptChars) return res.status(400).json({ message: `Prompt cannot exceed ${config.maxPromptChars} characters` });

  try {
    if (input.projectId && !(await Project.findByPk(input.projectId))) return res.status(400).json({ message: "Selected project was not found" });
    const blockedReason = input.dataClassification === "RESTRICTED"
      ? "Restricted data cannot be sent to the configured external AI provider"
      : input.containsPersonalData ? "Personal data must be removed or de-identified before AI processing" : null;

    const row = await AiInference.create({
      ...input,
      prompt: blockedReason ? "[REDACTED BY GOVERNANCE POLICY]" : input.prompt,
      projectId: input.projectId || null,
      promptHash: crypto.createHash("sha256").update(input.prompt).digest("hex"),
      requestedByUserId: req.user.id,
      providerName: config.provider,
      modelName: config.model,
      status: blockedReason ? "BLOCKED" : "REQUESTED",
      failureReason: blockedReason
    });
    await recordAudit(req, "CREATE", "AiInference", row.id, { status: row.status, promptHash: row.promptHash, classification: row.dataClassification });

    if (blockedReason) return res.status(422).json({ message: blockedReason, inference: row });
    await row.update({ status: "RUNNING" });

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Number(process.env.OPENAI_TIMEOUT_MS || 60000));
      let result;
      try { result = await runOpenAiInference({ prompt: input.prompt, userId: req.user.id, signal: controller.signal }); }
      finally { clearTimeout(timer); }
      await row.update({ ...result, status: "PENDING_REVIEW", completedAt: new Date(), failureReason: null });
      await recordAudit(req, "UPDATE", "AiInference", row.id, { status: row.status, modelName: row.modelName, totalTokens: row.totalTokens, latencyMs: row.latencyMs });
      res.status(201).json(await AiInference.findByPk(row.id, { include }));
    } catch (providerError) {
      const failureReason = providerError.name === "AbortError" ? "AI provider timed out" : providerError.message;
      await row.update({ status: "FAILED", failureReason, completedAt: new Date() });
      await recordAudit(req, "UPDATE", "AiInference", row.id, { status: "FAILED", failureReason });
      res.status(providerError.statusCode || 502).json({ message: failureReason, inferenceId: row.id });
    }
  } catch (error) { next(error); }
});

aiRouter.patch("/inferences/:id/review", allow("ADMIN", "MANAGER"), async (req, res, next) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues.map(issue => issue.message).join(", ") });
  try {
    const row = await AiInference.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "Inference not found" });
    if (row.status !== "PENDING_REVIEW") return res.status(409).json({ message: "Only pending AI output can be reviewed" });
    if (!aiConfig().selfApprovalAllowed && row.requestedByUserId === req.user.id) {
      return res.status(409).json({ message: "Maker-checker control requires a different user to review this output" });
    }
    await row.update({
      status: parsed.data.decision,
      reviewNote: parsed.data.note || null,
      reviewedByUserId: req.user.id,
      reviewedAt: new Date()
    });
    await recordAudit(req, "UPDATE", "AiInference", row.id, { status: row.status, reviewNote: row.reviewNote });
    res.json(await AiInference.findByPk(row.id, { include }));
  } catch (error) { next(error); }
});

export default aiRouter;
