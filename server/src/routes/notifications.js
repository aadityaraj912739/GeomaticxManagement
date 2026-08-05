import { Router } from "express";
import { Op } from "sequelize";
import { Notification, Task } from "../models/registry.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 10), 50) : 20;
    const where = { userId: req.user.id };
    const before = req.query.before ? new Date(req.query.before) : null;
    if (before && !Number.isNaN(before.getTime()) && req.query.beforeId) {
      where[Op.or] = [
        { createdAt: { [Op.lt]: before } },
        { createdAt: before, id: { [Op.lt]: req.query.beforeId } }
      ];
    }
    const [result, unreadCount] = await Promise.all([Notification.findAll({
      where,
      include: [{ model: Task, attributes: ["id", "title", "status", "progress"] }],
      order: [["createdAt", "DESC"], ["id", "DESC"]],
      limit: limit + 1
    }), Notification.count({ where: { userId: req.user.id, readAt: null } })]);
    const hasMore = result.length > limit;
    const rows = result.slice(0, limit);
    const last = rows.at(-1);
    res.json({
      unreadCount,
      rows,
      hasMore,
      nextCursor: hasMore && last ? { before: last.createdAt.toISOString(), beforeId: last.id } : null
    });
  } catch (e) { next(e); }
});

router.patch("/read-all", async (req, res, next) => {
  try {
    await Notification.update({ readAt: new Date() }, { where: { userId: req.user.id, readAt: null } });
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.patch("/:id/read", async (req, res, next) => {
  try {
    const row = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!row) return res.status(404).json({ message: "Notification not found" });
    if (!row.readAt) await row.update({ readAt: new Date() });
    res.json(row);
  } catch (e) { next(e); }
});

export default router;
