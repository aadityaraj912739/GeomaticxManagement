import { Router } from "express";
import { Op } from "sequelize";
import { Project, Task, User } from "../models/registry.js";
import { sequelize } from "../config/database.js";
import { allow } from "../middleware/auth.js";
import { recordAudit } from "../services/audit.js";
import { notifyManagers, notifyUser } from "../services/notifications.js";

const router = Router();
const supervisoryRoles = ["ADMIN", "MANAGER", "HR"];
const taskInclude = [
  { model: Project, attributes: ["id", "code", "name"] },
  { model: User, as: "assignee", attributes: ["id", "name", "email", "role"] }
];

const taskPayload = body => {
  const allowed = ["title", "description", "ProjectId", "assigneeId", "dueDate", "priority", "status", "progress"];
  return Object.fromEntries(allowed.filter(key => body[key] !== undefined).map(key => [key, body[key] === "" ? null : body[key]]));
};

const validStatus = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const validPriority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const fail = message => { const error = new Error(message); error.statusCode = 400; throw error; };

function validatePayload(changes, { creating = false } = {}) {
  if (creating && !String(changes.title || "").trim()) fail("Task title is required");
  if (changes.title !== undefined) {
    changes.title = String(changes.title).trim();
    if (!changes.title) fail("Task title is required");
    if (changes.title.length > 255) fail("Task title cannot exceed 255 characters");
  }
  if (changes.description !== undefined && changes.description !== null && typeof changes.description !== "string") fail("Description must be text");
  if (changes.status !== undefined && !validStatus.includes(changes.status)) fail("Select a valid task status");
  if (changes.priority !== undefined && !validPriority.includes(changes.priority)) fail("Select a valid task priority");
  if (changes.progress !== undefined && changes.progress !== null) {
    const progress = Number(changes.progress);
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) fail("Progress must be a whole number between 0 and 100");
    changes.progress = progress;
  }
  if (changes.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(changes.dueDate)) fail("Due date must be a valid date");
  return changes;
}

export function normalizeProgress(changes, currentStatus = null) {
  const hasProgress = Object.hasOwn(changes, "progress");
  const hasStatus = Object.hasOwn(changes, "status");
  if (changes.progress !== undefined && changes.progress !== null) changes.progress = Number(changes.progress);
  if (hasStatus && changes.status === "DONE") changes.progress = 100;
  else if (hasProgress && changes.progress === 100) changes.status = "DONE";
  else if (hasProgress && changes.progress < 100 && currentStatus === "DONE" && !hasStatus) changes.status = "IN_PROGRESS";
  return changes;
}

async function validateReferences(changes, transaction) {
  if (changes.assigneeId && !(await User.findOne({ where: { id: changes.assigneeId, active: true }, transaction }))) {
    const error = new Error("Select an active assignee"); error.statusCode = 400; throw error;
  }
  if (changes.ProjectId && !(await Project.findByPk(changes.ProjectId, { transaction }))) {
    const error = new Error("Selected project was not found"); error.statusCode = 400; throw error;
  }
}

router.get("/", async (req, res, next) => {
  try {
    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 10), 100) : 25;
    const q = String(req.query.q || "").trim().slice(0, 100);
    const where = supervisoryRoles.includes(req.user.role) ? {} : { assigneeId: req.user.id };
    if (req.query.taskId) where.id = req.query.taskId;
    if (q) where[Op.or] = [
      { title: { [Op.like]: `%${q}%` } },
      { description: { [Op.like]: `%${q}%` } }
    ];
    if (validStatus.includes(req.query.status)) where.status = req.query.status;
    if (validPriority.includes(req.query.priority)) where.priority = req.query.priority;
    if (supervisoryRoles.includes(req.user.role) && req.query.assigneeId) where.assigneeId = req.query.assigneeId;
    if (req.query.ProjectId) where.ProjectId = req.query.ProjectId;
    const { count, rows } = await Task.findAndCountAll({
      where,
      include: taskInclude,
      distinct: true,
      limit,
      offset: (page - 1) * limit,
      order: [["dueDate", "ASC"], ["createdAt", "DESC"]]
    });
    const pages = Math.max(1, Math.ceil(count / limit));
    res.json({ rows, pagination: { page, limit, total: count, pages } });
  } catch (e) { next(e); }
});

router.post("/", allow(...supervisoryRoles), async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const changes = normalizeProgress(validatePayload(taskPayload(req.body), { creating: true }));
    await validateReferences(changes, transaction);
    const row = await Task.create(changes, { transaction });
    await recordAudit(req, "CREATE", "Task", row.id, { after: row }, { transaction });
    await notifyUser(row.assigneeId, row.id, "TASK_ASSIGNED", "New task assigned", `${row.title} has been assigned to you.`, { transaction });
    const result = await Task.findByPk(row.id, { include: taskInclude, transaction });
    await transaction.commit();
    res.status(201).json(result);
  } catch (e) { await transaction.rollback(); next(e); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const row = await Task.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "Record not found" });
    const supervisor = supervisoryRoles.includes(req.user.role);
    if (!supervisor && row.assigneeId !== req.user.id) return res.status(403).json({ message: "You can only update tasks assigned to you" });
    const changes = supervisor
      ? normalizeProgress(validatePayload(taskPayload(req.body)), row.status)
      : normalizeProgress(validatePayload(Object.fromEntries(["status", "progress"].filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]))), row.status);
    await validateReferences(changes);
    const before = row.toJSON();
    await row.update(changes);
    await recordAudit(req, "UPDATE", "Task", row.id, { before, after: row });

    if (supervisor && row.assigneeId && (before.assigneeId !== row.assigneeId || before.status !== row.status || before.dueDate !== row.dueDate)) {
      const type = before.assigneeId !== row.assigneeId ? "TASK_ASSIGNED" : "TASK_UPDATED";
      await notifyUser(row.assigneeId, row.id, type, type === "TASK_ASSIGNED" ? "Task assigned" : "Task updated", `${row.title} is now ${row.status.replaceAll("_", " ")} (${row.progress}%).`);
    }
    if (!supervisor && (before.status !== row.status || before.progress !== row.progress)) {
      await notifyManagers({ actorId: req.user.id, taskId: row.id, type: "TASK_PROGRESS", title: "Task progress updated", message: `${req.user.name} updated ${row.title} to ${row.progress}% (${row.status.replaceAll("_", " ")}).` });
    }
    res.json(await Task.findByPk(row.id, { include: taskInclude }));
  } catch (e) { next(e); }
});

router.delete("/:id", allow(...supervisoryRoles), async (req, res, next) => {
  try {
    const row = await Task.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "Record not found" });
    const before = row.toJSON();
    await row.destroy();
    await recordAudit(req, "DELETE", "Task", req.params.id, { before });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
