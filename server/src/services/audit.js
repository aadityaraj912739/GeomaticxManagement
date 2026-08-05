import { AuditLog } from "../models/registry.js";

const plain = value => value?.toJSON ? value.toJSON() : value;

export async function recordAudit(req, action, entityType, entityId, details = null, options = {}) {
  await AuditLog.create({
    action,
    entityType,
    entityId,
    details: plain(details),
    actorId: req.user.id,
    ipAddress: req.ip
  }, options);
}
