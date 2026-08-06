import { Router } from "express";
import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import { allow } from "../middleware/auth.js";
import { BidCostItem, Client, MarketingActivity, MarketingOpportunity, Notification, Project, User } from "../models/registry.js";
import { recordAudit } from "../services/audit.js";

const router = Router();
const marketingRoles = ["ADMIN", "MANAGER", "MARKETING_MANAGER", "MARKETING_EXECUTIVE"];
const managerRoles = ["ADMIN", "MANAGER", "MARKETING_MANAGER"];
const fullInclude = [
  { model: User, as: "assignedExecutive", attributes: ["id", "name", "email"] },
  { model: BidCostItem, as: "costItems" },
  { model: MarketingActivity, as: "activities" }
];

const visibleWhere = req => req.user.role === "MARKETING_EXECUTIVE"
  ? { [Op.or]: [{ assignedExecutiveId: req.user.id }, { assignedExecutiveId: null }] }
  : {};
const clean = body => Object.fromEntries(Object.entries(body).map(([key, value]) => [key, value === "" ? null : value]));
async function notifyRoles(roles, actorId, type, title, message) {
  const recipients = await User.findAll({ where: { active: true, role: { [Op.in]: roles }, id: { [Op.ne]: actorId } }, attributes: ["id"] });
  await Notification.bulkCreate(recipients.map(user => ({ userId: user.id, type, title, message })));
}
async function notifyExecutive(opportunity, actorId, type, title, message) {
  if (opportunity.assignedExecutiveId && opportunity.assignedExecutiveId !== actorId) await Notification.create({ userId: opportunity.assignedExecutiveId, type, title, message });
}

router.get("/team", allow(...marketingRoles), async (_req, res, next) => {
  try {
    res.json(await User.findAll({ where: { active: true, role: { [Op.in]: ["MARKETING_EXECUTIVE", "MARKETING_MANAGER"] } }, attributes: ["id", "name", "email", "role"], order: [["name", "ASC"]] }));
  } catch (error) { next(error); }
});

router.get("/dashboard", allow(...marketingRoles), async (req, res, next) => {
  try {
    const where = visibleWhere(req);
    const rows = await MarketingOpportunity.findAll({ where, attributes: ["status", "estimatedValue", "quotedValue", "submissionDeadline", "nextFollowUpAt"] });
    const now = Date.now();
    const activeStatuses = new Set(["NEW", "SCREENING", "MANAGER_REVIEW", "ADMIN_REVIEW", "BID_APPROVED", "BID_PREPARATION", "SUBMITTED", "TECHNICAL_EVALUATION", "QUALIFIED", "FINANCIAL_EVALUATION", "NEGOTIATION"]);
    const active = rows.filter(row => activeStatuses.has(row.status));
    const awarded = rows.filter(row => row.status === "AWARDED");
    const lost = rows.filter(row => ["LOST", "NO_BID"].includes(row.status));
    res.json({
      total: rows.length,
      active: active.length,
      pipelineValue: active.reduce((sum, row) => sum + Number(row.estimatedValue || 0), 0),
      managerPending: rows.filter(row => row.status === "MANAGER_REVIEW").length,
      adminPending: rows.filter(row => row.status === "ADMIN_REVIEW").length,
      bidsInPreparation: rows.filter(row => ["BID_APPROVED", "BID_PREPARATION"].includes(row.status)).length,
      submitted: rows.filter(row => row.submittedAt).length,
      awarded: awarded.length,
      lost: lost.length,
      winPercentage: awarded.length + lost.length ? Math.round(awarded.length * 100 / (awarded.length + lost.length)) : 0,
      upcomingDeadlines: rows.filter(row => row.submissionDeadline && new Date(row.submissionDeadline).getTime() >= now && new Date(row.submissionDeadline).getTime() <= now + 7 * 86400000).length,
      overdueFollowUps: rows.filter(row => row.nextFollowUpAt && new Date(row.nextFollowUpAt).getTime() < now && !["AWARDED", "LOST", "NO_BID"].includes(row.status)).length
    });
  } catch (error) { next(error); }
});

router.get("/opportunities", allow(...marketingRoles), async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const visibility = visibleWhere(req);
    const search = q ? { [Op.or]: ["title", "clientName", "enquiryNumber", "location", "service"].map(field => ({ [field]: { [Op.like]: `%${q}%` } })) } : {};
    const restricted = req.user.role === "MARKETING_EXECUTIVE";
    const where = restricted && q ? { [Op.and]: [visibility, search] } : { ...visibility, ...search };
    if (req.query.status) where.status = req.query.status;
    res.json(await MarketingOpportunity.findAll({ where, include: fullInclude, order: [["submissionDeadline", "ASC"], ["createdAt", "DESC"]] }));
  } catch (error) { next(error); }
});

router.post("/opportunities", allow(...marketingRoles), async (req, res, next) => {
  try {
    if (!req.body.title || !req.body.clientName) return res.status(400).json({ message: "Work title and client are required" });
    const assignedExecutiveId = req.user.role === "MARKETING_EXECUTIVE" ? req.user.id : (req.body.assignedExecutiveId || null);
    const row = await MarketingOpportunity.create({ ...clean(req.body), assignedExecutiveId, status: "NEW" });
    await recordAudit(req, "CREATE", "MarketingOpportunity", row.id, { after: row });
    await notifyExecutive(row, req.user.id, "MARKETING_ASSIGNED", "New opportunity assigned", row.title);
    res.status(201).json(row);
  } catch (error) { next(error); }
});

router.patch("/opportunities/:id/screen", allow("ADMIN", "MARKETING_EXECUTIVE", "MARKETING_MANAGER"), async (req, res, next) => {
  try {
    const row = await MarketingOpportunity.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "Opportunity not found" });
    if (req.user.role === "MARKETING_EXECUTIVE" && row.assignedExecutiveId && row.assignedExecutiveId !== req.user.id) return res.status(403).json({ message: "This opportunity is assigned to another executive" });
    const allowed = ["BID_RECOMMENDED", "NO_BID_RECOMMENDED", "MORE_INFORMATION_REQUIRED", "HOLD"];
    if (!allowed.includes(req.body.recommendation)) return res.status(400).json({ message: "Choose a valid screening recommendation" });
    const before = row.toJSON();
    await row.update({ assignedExecutiveId: row.assignedExecutiveId || req.user.id, screeningRecommendation: req.body.recommendation, screeningNotes: req.body.notes || null, status: req.body.recommendation === "HOLD" ? "HOLD" : "MANAGER_REVIEW" });
    await recordAudit(req, "UPDATE", "MarketingOpportunity", row.id, { before, after: row, stage: "EXECUTIVE_SCREENING" });
    await notifyRoles(["MARKETING_MANAGER"], req.user.id, "MARKETING_REVIEW", "Manager review pending", row.title);
    res.json(row);
  } catch (error) { next(error); }
});

router.patch("/opportunities/:id/manager-review", allow(...managerRoles), async (req, res, next) => {
  try {
    const row = await MarketingOpportunity.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "Opportunity not found" });
    if (row.status !== "MANAGER_REVIEW") return res.status(409).json({ message: "Executive screening must be completed first" });
    const decisions = { RECOMMEND_GO: "ADMIN_REVIEW", RECOMMEND_NO_BID: "ADMIN_REVIEW", RETURN_TO_EXECUTIVE: "SCREENING", HOLD: "HOLD" };
    if (!decisions[req.body.decision]) return res.status(400).json({ message: "Choose a valid manager decision" });
    const before = row.toJSON();
    await row.update({ managerDecision: req.body.decision, managerNotes: req.body.notes || null, status: decisions[req.body.decision] });
    await recordAudit(req, "UPDATE", "MarketingOpportunity", row.id, { before, after: row, stage: "MANAGER_REVIEW" });
    if (req.body.decision === "RETURN_TO_EXECUTIVE") await notifyExecutive(row, req.user.id, "MARKETING_RETURNED", "Opportunity returned for correction", row.title);
    else if (row.status === "ADMIN_REVIEW") await notifyRoles(["ADMIN"], req.user.id, "MARKETING_APPROVAL", "Admin Go/No-Go pending", row.title);
    res.json(row);
  } catch (error) { next(error); }
});

router.patch("/opportunities/:id/admin-decision", allow("ADMIN"), async (req, res, next) => {
  try {
    const row = await MarketingOpportunity.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "Opportunity not found" });
    if (row.status !== "ADMIN_REVIEW") return res.status(409).json({ message: "Manager recommendation must be completed first" });
    const decisions = { GO_FOR_BID: "BID_APPROVED", APPROVE_WITH_CONDITIONS: "BID_APPROVED", NO_BID: "NO_BID", HOLD: "HOLD", RETURN_TO_MANAGER: "MANAGER_REVIEW" };
    if (!decisions[req.body.decision]) return res.status(400).json({ message: "Choose a valid admin decision" });
    const before = row.toJSON();
    await row.update({ adminDecision: req.body.decision, adminNotes: req.body.notes || null, status: decisions[req.body.decision] });
    await recordAudit(req, "UPDATE", "MarketingOpportunity", row.id, { before, after: row, stage: "ADMIN_GO_NO_GO" });
    await notifyExecutive(row, req.user.id, "MARKETING_DECISION", `Admin decision: ${req.body.decision.replaceAll("_", " ")}`, row.title);
    if (req.body.decision === "RETURN_TO_MANAGER") await notifyRoles(["MARKETING_MANAGER"], req.user.id, "MARKETING_RETURNED", "Admin returned opportunity", row.title);
    res.json(row);
  } catch (error) { next(error); }
});

router.post("/opportunities/:id/cost-items", allow(...managerRoles), async (req, res, next) => {
  try {
    const opportunity = await MarketingOpportunity.findByPk(req.params.id);
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });
    if (!["BID_APPROVED", "BID_PREPARATION"].includes(opportunity.status)) return res.status(409).json({ message: "Admin Go approval is required before costing" });
    const quantity = Number(req.body.quantity || 1), rate = Number(req.body.rate);
    if (!req.body.description || !Number.isFinite(rate) || rate < 0 || !Number.isFinite(quantity) || quantity <= 0) return res.status(400).json({ message: "Valid description, quantity and rate are required" });
    const item = await BidCostItem.create({ opportunityId: opportunity.id, category: req.body.category, description: req.body.description, quantity, rate, amount: quantity * rate });
    await opportunity.update({ status: "BID_PREPARATION" });
    await recordAudit(req, "CREATE", "BidCostItem", item.id, { after: item });
    res.status(201).json(item);
  } catch (error) { next(error); }
});

router.post("/opportunities/:id/activities", allow(...marketingRoles), async (req, res, next) => {
  try {
    const opportunity = await MarketingOpportunity.findByPk(req.params.id);
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });
    if (!req.body.details) return res.status(400).json({ message: "Activity details are required" });
    const activity = await MarketingActivity.create({ opportunityId: opportunity.id, activityType: req.body.activityType, details: req.body.details, occurredAt: req.body.occurredAt || new Date(), nextFollowUpAt: req.body.nextFollowUpAt || null, createdByUserId: req.user.id });
    if (req.body.nextFollowUpAt) await opportunity.update({ nextFollowUpAt: req.body.nextFollowUpAt });
    await recordAudit(req, "CREATE", "MarketingActivity", activity.id, { after: activity });
    res.status(201).json(activity);
  } catch (error) { next(error); }
});

router.patch("/opportunities/:id/submit", allow(...managerRoles), async (req, res, next) => {
  try {
    const row = await MarketingOpportunity.findByPk(req.params.id, { include: [{ model: BidCostItem, as: "costItems" }] });
    if (!row) return res.status(404).json({ message: "Opportunity not found" });
    if (!["GO_FOR_BID", "APPROVE_WITH_CONDITIONS"].includes(row.adminDecision)) return res.status(409).json({ message: "Admin Go approval is required before bid submission" });
    if (!req.body.portalName || !req.body.bidReference || !req.body.quotedValue) return res.status(400).json({ message: "Portal, bid reference and final quoted value are required" });
    const before = row.toJSON();
    await row.update({ portalName: req.body.portalName, bidReference: req.body.bidReference, quotedValue: req.body.quotedValue, submissionReceipt: req.body.submissionReceipt || null, submittedAt: new Date(), status: "SUBMITTED" });
    await recordAudit(req, "UPDATE", "MarketingOpportunity", row.id, { before, after: row, stage: "BID_SUBMISSION" });
    res.json(row);
  } catch (error) { next(error); }
});

router.patch("/opportunities/:id/result", allow(...managerRoles), async (req, res, next) => {
  try {
    const row = await MarketingOpportunity.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "Opportunity not found" });
    const allowed = ["TECHNICAL_EVALUATION", "QUALIFIED", "FINANCIAL_EVALUATION", "NEGOTIATION", "AWARDED", "LOST"];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Choose a valid post-bid status" });
    await row.update({ status: req.body.status, resultReason: req.body.reason || row.resultReason });
    await recordAudit(req, "UPDATE", "MarketingOpportunity", row.id, { after: row, stage: "POST_BID" });
    res.json(row);
  } catch (error) { next(error); }
});

router.post("/opportunities/:id/convert-project", allow("ADMIN"), async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const row = await MarketingOpportunity.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) { await transaction.rollback(); return res.status(404).json({ message: "Opportunity not found" }); }
    if (row.status !== "AWARDED") { await transaction.rollback(); return res.status(409).json({ message: "Only an awarded bid can be converted" }); }
    if (row.convertedProjectId) { await transaction.rollback(); return res.status(409).json({ message: "This bid is already converted" }); }
    const [client] = await Client.findOrCreate({ where: { name: row.clientName }, defaults: { name: row.clientName, contactName: row.contactPerson, email: row.contactEmail }, transaction });
    const code = req.body.code || `MKT-${new Date().getFullYear()}-${row.id.slice(0, 6).toUpperCase()}`;
    const project = await Project.create({ code, name: row.title, description: row.scope, status: "PLANNED", budget: row.quotedValue || row.estimatedValue, location: row.location, ClientId: client.id, managerId: req.body.managerId || null, startDate: req.body.startDate || null, endDate: req.body.endDate || null }, { transaction });
    await row.update({ convertedProjectId: project.id }, { transaction });
    await transaction.commit();
    await recordAudit(req, "CREATE", "Project", project.id, { sourceOpportunityId: row.id, after: project });
    res.status(201).json(project);
  } catch (error) { await transaction.rollback(); next(error); }
});

export default router;
