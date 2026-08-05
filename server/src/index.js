import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { sequelize } from "./config/database.js";
import { User } from "./models/registry.js";
import { authenticate } from "./middleware/auth.js";
import authRouter from "./routes/auth.js";
import { crudRouter, usersRouter } from "./routes/crud.js";
import { attendanceRouter, auditRouter, dashboardRouter, reportingRouter, submissionsRouter } from "./routes/special.js";
import aiRouter from "./routes/ai.js";
import tasksRouter from "./routes/tasks.js";
import notificationsRouter from "./routes/notifications.js";

for (const key of ["MYSQL_PASSWORD", "JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"]) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}
if (process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters");

const app = express();
app.use(helmet());
app.use(cors({ origin: (process.env.CLIENT_URL || "http://localhost:5173").split(","), credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("combined"));
app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api", authenticate);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/reports", reportingRouter);
app.use("/api/users", usersRouter);
app.use("/api/offices", crudRouter("Office", ["ADMIN", "HR"]));
app.use("/api/departments", crudRouter("Department", ["ADMIN", "HR"]));
app.use("/api/designations", crudRouter("Designation", ["ADMIN", "HR"]));
app.use("/api/employees", crudRouter("Employee", ["ADMIN", "HR"]));
app.use("/api/clients", crudRouter("Client"));
app.use("/api/projects", crudRouter("Project"));
app.use("/api/tasks", tasksRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/spatial-records", crudRouter("SpatialRecord", ["ADMIN", "MANAGER", "SURVEYOR"]));
app.use("/api/processing-jobs", crudRouter("ProcessingJob", ["ADMIN", "MANAGER", "SURVEYOR"]));
app.use("/api/asset-records", crudRouter("AssetRecord", ["ADMIN", "MANAGER", "HR"]));
app.use("/api/commercial-records", crudRouter("CommercialRecord"));
app.use("/api/qc-approvals", crudRouter("QcApproval", ["ADMIN", "MANAGER", "SURVEYOR"]));
app.use("/api/ai-records", crudRouter("AiRecord", ["ADMIN", "MANAGER", "SURVEYOR"]));
app.use("/api/ai", aiRouter);
app.use("/api/security-registers", crudRouter("SecurityRegister", ["ADMIN"]));
app.use("/api/attendance", attendanceRouter);
app.use("/api/survey-forms", crudRouter("SurveyForm", ["ADMIN", "MANAGER"]));
app.use("/api/survey-submissions", submissionsRouter);
app.use("/api/audit-logs", auditRouter);
app.use((err, _req, res, _next) => {
  console.error(err);
  const validation = err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError";
  const invalidReference = err.name === "SequelizeForeignKeyConstraintError";
  const invalidData = err.name === "SequelizeDatabaseError";
  const status = err.statusCode || (validation || invalidReference || invalidData ? 400 : 500);
  const message = validation
    ? err.errors.map(x => x.message).join(", ")
    : invalidReference
      ? "Selected project or assignee is no longer available"
      : invalidData
        ? "Task data is invalid. Check the selected values and dates"
        : err.statusCode ? err.message : "Internal server error";
  res.status(status).json({ message });
});

async function start() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: process.env.SEQUELIZE_SYNC_ALTER === "true" });
  const email = process.env.ADMIN_EMAIL.toLowerCase();
  const [admin, created] = await User.findOrCreate({
    where: { email },
    defaults: { name: process.env.ADMIN_NAME || "Primary Administrator", email, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), role: "ADMIN" }
  });
  if (created) console.log(`Bootstrap administrator created: ${admin.email}`);
  app.listen(Number(process.env.PORT || 4000), "0.0.0.0", () => console.log(`API listening on port ${process.env.PORT || 4000}`));
}
start().catch(e => { console.error(e); process.exit(1); });
