import { Router } from "express";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { models, User } from "../models/registry.js";
import { allow } from "../middleware/auth.js";
import { recordAudit } from "../services/audit.js";

export const crudRouter = (modelName, writableRoles = ["ADMIN", "MANAGER"]) => {
  const router = Router();
  const Model = models[modelName];
  router.get("/", async (req, res, next) => {
    try {
      const limit = Math.min(Number(req.query.limit || 100), 200);
      const q = String(req.query.q || "").trim();
      const searchable = ["name", "title", "code", "employeeCode", "firstName"].filter(k => Model.rawAttributes[k]);
      const where = q && searchable.length ? { [Op.or]: searchable.map(k => ({ [k]: { [Op.like]: `%${q}%` } })) } : {};
      res.json(await Model.findAll({ where, limit, order: [["createdAt", "DESC"]] }));
    } catch (e) { next(e); }
  });
  router.get("/:id", async (req, res, next) => {
    try { const row = await Model.findByPk(req.params.id); row ? res.json(row) : res.status(404).json({ message: "Record not found" }); } catch (e) { next(e); }
  });
  router.post("/", allow(...writableRoles), async (req, res, next) => {
    try {
      const row = await Model.create(req.body);
      await recordAudit(req, "CREATE", modelName, row.id, { after: row });
      res.status(201).json(row);
    } catch (e) { next(e); }
  });
  router.put("/:id", allow(...writableRoles), async (req, res, next) => {
    try {
      const row = await Model.findByPk(req.params.id);
      if (!row) return res.status(404).json({ message: "Record not found" });
      const before = row.toJSON();
      await row.update(req.body);
      await recordAudit(req, "UPDATE", modelName, row.id, { before, after: row });
      res.json(row);
    } catch (e) { next(e); }
  });
  router.delete("/:id", allow("ADMIN"), async (req, res, next) => {
    try {
      const row = await Model.findByPk(req.params.id);
      if (!row) return res.status(404).json({ message: "Record not found" });
      const before = row.toJSON();
      await row.destroy();
      await recordAudit(req, "DELETE", modelName, req.params.id, { before });
      res.status(204).end();
    } catch (e) { next(e); }
  });
  return router;
};

export const usersRouter = Router();
usersRouter.get("/", allow("ADMIN", "MANAGER", "HR"), async (_req, res) => res.json(await User.findAll({
  attributes: { exclude: ["passwordHash"] }, order: [["createdAt", "DESC"]]
})));
usersRouter.post("/", allow("ADMIN"), async (req, res, next) => {
  try {
    const { name, email, password, role = "EMPLOYEE" } = req.body;
    if (!name || !email || !password || password.length < 10) return res.status(400).json({ message: "Name, valid email and password of 10+ characters required" });
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12), role });
    const result = { id: user.id, name: user.name, email: user.email, role: user.role, active: user.active };
    await recordAudit(req, "CREATE", "User", user.id, { after: result });
    res.status(201).json(result);
  } catch (e) { next(e); }
});
usersRouter.put("/:id", allow("ADMIN"), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Record not found" });
    const before = { name: user.name, email: user.email, role: user.role, active: user.active };
    const changes = {};
    for (const key of ["name", "email", "role"]) if (req.body[key] !== undefined) changes[key] = req.body[key];
    if (changes.email) changes.email = changes.email.toLowerCase();
    if (req.body.password) {
      if (req.body.password.length < 10) return res.status(400).json({ message: "Password must contain at least 10 characters" });
      changes.passwordHash = await bcrypt.hash(req.body.password, 12);
    }
    await user.update(changes);
    const after = { name: user.name, email: user.email, role: user.role, active: user.active };
    await recordAudit(req, "UPDATE", "User", user.id, { before, after, passwordChanged: Boolean(req.body.password) });
    res.json({ id: user.id, ...after });
  } catch (e) { next(e); }
});
usersRouter.patch("/:id/status", allow("ADMIN"), async (req, res, next) => {
  try {
    if (req.params.id === req.user.id && req.body.active === false) {
      return res.status(400).json({ message: "You cannot deactivate your own account" });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "Record not found" });
    if (typeof req.body.active !== "boolean") return res.status(400).json({ message: "Active must be true or false" });
    await user.update({ active: req.body.active });
    await recordAudit(req, req.body.active ? "ACTIVATE" : "DEACTIVATE", "User", user.id, { active: user.active });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, active: user.active });
  } catch (e) { next(e); }
});
