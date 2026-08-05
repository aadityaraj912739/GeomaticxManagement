import { Op } from "sequelize";
import { Notification, User } from "../models/registry.js";

export async function notifyUser(userId, taskId, type, title, message, options = {}) {
  if (!userId) return null;
  return Notification.create({ userId, taskId, type, title, message }, options);
}

export async function notifyManagers({ actorId, taskId, type, title, message }) {
  const managers = await User.findAll({
    where: { role: { [Op.in]: ["ADMIN", "MANAGER"] }, active: true },
    attributes: ["id"]
  });
  return Promise.all(managers
    .filter(manager => manager.id !== actorId)
    .map(manager => notifyUser(manager.id, taskId, type, title, message)));
}
