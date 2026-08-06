import { Router } from "express";
import { Op } from "sequelize";
import { Attendance, AttendanceBreak, AiInference, AssetRecord, AuditLog, Client, CommercialRecord, Employee, MarketingOpportunity, Office, ProcessingJob, Project, QcApproval, SecurityRegister, SpatialRecord, SurveyForm, SurveySubmission, Task, User } from "../models/registry.js";
import { allow } from "../middleware/auth.js";
import { recordAudit } from "../services/audit.js";

const supervisoryRoles = ["ADMIN", "MANAGER", "HR"];

async function employeeForUser(userId) {
  return Employee.findOne({ where: { userId } });
}

export const dashboardRouter = Router();
dashboardRouter.get("/", async (_req, res) => {
  const [employees, offices, clients, projects, tasks, attendance, surveyForms, submissions, spatialRecords, processingJobs, assets, commercialRecords, approvals, aiRecords, securityRegisters, marketingOpportunities, activeBreakRows] = await Promise.all([
    Employee.count(), Office.count(), Client.count(), Project.count(), Task.count(), Attendance.count(), SurveyForm.count(), SurveySubmission.count(),
    SpatialRecord.count(), ProcessingJob.count(), AssetRecord.count(), CommercialRecord.count(), QcApproval.count(), AiInference.count(), SecurityRegister.count(), MarketingOpportunity.count(),
    AttendanceBreak.findAll({ where: { resumedAt: null }, include: [{ model: Attendance, include: [{ model: Employee, attributes: ["id", "employeeCode", "firstName", "lastName"] }] }], order: [["startedAt", "DESC"]] })
  ]);
  res.json({ employees, offices, clients, projects, tasks, attendance, surveyForms, submissions, spatialRecords, processingJobs, assets, commercialRecords, approvals, aiRecords, securityRegisters, marketingOpportunities, activeBreaks: activeBreakRows.length, onBreakEmployees: activeBreakRows.map(row => ({ id: row.id, breakType: row.breakType, startedAt: row.startedAt, employee: row.Attendance?.Employee || null })) });
});

export const reportingRouter = Router();
reportingRouter.get("/management", async (_req, res, next) => {
  try {
    const [activeProjects, completedProjects, openTasks, pendingApprovals, fieldRecords, readyProcessing, failedProcessing, protectedAssets, pendingAi, pendingSecurity, approvedDeliverables, blockedControls] = await Promise.all([
      Project.count({ where: { status: "ACTIVE" } }),
      Project.count({ where: { status: "COMPLETED" } }),
      Task.count({ where: { status: { [Op.ne]: "DONE" } } }),
      QcApproval.count({ where: { approvalStatus: { [Op.in]: ["DRAFT", "SUBMITTED"] } } }),
      SpatialRecord.count(),
      ProcessingJob.count({ where: { stage: { [Op.in]: ["READY", "QC"] } } }),
      ProcessingJob.count({ where: { stage: "FAILED" } }),
      AssetRecord.count({ where: { status: { [Op.in]: ["AVAILABLE", "ASSIGNED", "IN_MAINTENANCE", "CALIBRATION_DUE"] } } }),
      AiInference.count({ where: { status: { [Op.in]: ["REQUESTED", "RUNNING", "PENDING_REVIEW", "REJECTED", "BLOCKED", "FAILED"] } } }),
      SecurityRegister.count({ where: { status: { [Op.in]: ["OPEN", "IN_REVIEW", "BLOCKED"] } } }),
      QcApproval.count({ where: { approvalStatus: "APPROVED" } }),
      SecurityRegister.count({ where: { controlStatus: "FAIL" } })
    ]);

    const [recentExceptions, recentPendingActions] = await Promise.all([
      Promise.all([
        QcApproval.findAll({ where: { approvalStatus: { [Op.in]: ["REJECTED", "SUBMITTED"] } }, order: [["updatedAt", "DESC"]], limit: 5 }),
        ProcessingJob.findAll({ where: { stage: "FAILED" }, order: [["updatedAt", "DESC"]], limit: 5 }),
        AiInference.findAll({ where: { status: { [Op.in]: ["PENDING_REVIEW", "REJECTED", "BLOCKED", "FAILED"] } }, order: [["updatedAt", "DESC"]], limit: 5 }),
        SecurityRegister.findAll({ where: { status: { [Op.in]: ["OPEN", "BLOCKED"] } }, order: [["updatedAt", "DESC"]], limit: 5 })
      ]).then(groups => groups.flat()),
      Promise.all([
        Task.findAll({ where: { status: { [Op.ne]: "DONE" } }, order: [["dueDate", "ASC"]], limit: 3 }),
        AssetRecord.findAll({ where: { status: { [Op.in]: ["IN_MAINTENANCE", "CALIBRATION_DUE", "LOST"] } }, order: [["updatedAt", "DESC"]], limit: 3 }),
        AiInference.findAll({ where: { status: { [Op.in]: ["PENDING_REVIEW", "FAILED"] } }, order: [["updatedAt", "DESC"]], limit: 3 })
      ]).then(groups => groups.flat())
    ]);

    res.json({
      employeeDashboard: { openTasks, protectedAssets },
      projectManagerDashboard: { activeProjects, completedProjects, pendingApprovals },
      hrDashboard: { employees: await Employee.count(), offices: await Office.count(), accessReviews: await SecurityRegister.count({ where: { registerType: "ACCESS_REVIEW" } }) },
      fieldOperationDashboard: { fieldRecords, protectedAssets },
      projectProgressDashboard: { activeProjects, completedProjects, approvedDeliverables },
      processingDashboard: { readyProcessing, failedProcessing },
      securityReadinessDashboard: { pendingSecurity, blockedControls },
      productionDataDashboard: { approvedDeliverables, pendingAi },
      mobileReadinessDashboard: { attendance: await Attendance.count(), aiRecords: await AiInference.count() },
      goLiveCentre: { pendingApprovals, blockedControls, failedProcessing },
      exceptions: recentExceptions.map(row => ({ id: row.id, label: row.title || row.datasetName || row.entityName || row.assetTag, type: row.constructor.name, status: row.approvalStatus || row.stage || row.controlStatus || row.status })),
      pendingActions: recentPendingActions.map(row => ({ id: row.id, label: row.title || row.title || row.assetTag || row.datasetName || row.taskName || row.description || row.name, type: row.constructor.name, status: row.status || row.stage || row.approvalStatus }))
    });
  } catch (e) { next(e); }
});

export const auditRouter = Router();
auditRouter.get("/", allow("ADMIN"), async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 200);
    res.json(await AuditLog.findAll({
      include: [{ model: User, as: "actor", attributes: ["id", "name", "email"] }],
      order: [["createdAt", "DESC"]],
      limit
    }));
  } catch (e) { next(e); }
});

export const attendanceRouter = Router();
attendanceRouter.get("/", async (req, res, next) => {
  try {
    let where = {};
    if (!supervisoryRoles.includes(req.user.role)) {
      const employee = await employeeForUser(req.user.id);
      if (!employee) return res.json([]);
      where = { employeeId: employee.id };
    }
    res.json(await Attendance.findAll({ where, include: [{ model: Employee }, { model: AttendanceBreak, as: "breaks", order: [["startedAt", "ASC"]] }], order: [["workDate", "DESC"], ["checkIn", "DESC"]] }));
  } catch (e) { next(e); }
});
attendanceRouter.post("/", allow("ADMIN", "MANAGER", "HR", "SURVEYOR", "EMPLOYEE", "MARKETING_EXECUTIVE", "MARKETING_MANAGER"), async (req, res, next) => {
  try {
    const ownEmployee = await employeeForUser(req.user.id);
    const requestedEmployeeId = supervisoryRoles.includes(req.user.role) ? req.body.employeeId : null;
    const employeeId = requestedEmployeeId || ownEmployee?.id;
    if (!employeeId) return res.status(400).json({ message: "Your user account is not linked to an employee record" });
    const employee = requestedEmployeeId ? await Employee.findByPk(requestedEmployeeId) : ownEmployee;
    if (!employee) return res.status(400).json({ message: "Employee record not found" });
    const workDate = req.body.workDate || new Date().toISOString().slice(0, 10);
    const latitude = Number(req.body.latitude), longitude = Number(req.body.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: "A valid automatically detected location is required for check-in" });
    }
    const defaults = {
      employeeId,
      workDate,
      checkIn: req.body.checkIn || new Date(),
      latitude,
      longitude,
      locationAccuracy: Number.isFinite(Number(req.body.locationAccuracy)) ? Number(req.body.locationAccuracy) : null,
      notes: req.body.notes || null
    };
    const [row, created] = await Attendance.findOrCreate({
      where: { employeeId, workDate },
      defaults
    });
    if (created) await recordAudit(req, "CREATE", "Attendance", row.id, { after: row });
    res.status(created ? 201 : 200).json(row);
  } catch (e) { next(e); }
});
attendanceRouter.patch("/:id/checkout", async (req, res, next) => {
  try {
    const row = await Attendance.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "Record not found" });
    if (!supervisoryRoles.includes(req.user.role)) {
      const employee = await employeeForUser(req.user.id);
      if (!employee || row.employeeId !== employee.id) return res.status(403).json({ message: "You can only check out your own attendance" });
    }
    if (row.checkOut) return res.status(409).json({ message: "Attendance is already checked out" });
    if (!String(req.body.workDescription || "").trim()) return res.status(400).json({ message: "Please describe the work completed today before checking out" });
    const activeBreak = await AttendanceBreak.findOne({ where: { attendanceId: row.id, resumedAt: null } });
    if (activeBreak) return res.status(409).json({ message: "Resume work before checking out" });
    const before = row.toJSON();
    await row.update({ checkOut: new Date(), workDescription: String(req.body.workDescription).trim() });
    await recordAudit(req, "UPDATE", "Attendance", row.id, { before, after: row });
    res.json(row);
  } catch (e) { next(e); }
});
attendanceRouter.post("/:id/breaks", async (req, res, next) => {
  try {
    const row = await Attendance.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "Attendance record not found" });
    const employee = await employeeForUser(req.user.id);
    if (!supervisoryRoles.includes(req.user.role) && (!employee || row.employeeId !== employee.id)) return res.status(403).json({ message: "You can only manage your own breaks" });
    if (row.checkOut) return res.status(409).json({ message: "Workday is already completed" });
    if (await AttendanceBreak.findOne({ where: { attendanceId: row.id, resumedAt: null } })) return res.status(409).json({ message: "A break is already active" });
    const allowed = ["TEA", "LUNCH", "PERSONAL", "OTHER"];
    const breakType = allowed.includes(req.body.breakType) ? req.body.breakType : "TEA";
    const entry = await AttendanceBreak.create({ attendanceId: row.id, breakType, notes: req.body.notes || null, startedAt: new Date() });
    await recordAudit(req, "CREATE", "AttendanceBreak", entry.id, { after: entry });
    res.status(201).json(entry);
  } catch (e) { next(e); }
});
attendanceRouter.patch("/:attendanceId/breaks/:breakId/resume", async (req, res, next) => {
  try {
    const row = await Attendance.findByPk(req.params.attendanceId);
    const entry = await AttendanceBreak.findOne({ where: { id: req.params.breakId, attendanceId: req.params.attendanceId } });
    if (!row || !entry) return res.status(404).json({ message: "Active break not found" });
    const employee = await employeeForUser(req.user.id);
    if (!supervisoryRoles.includes(req.user.role) && (!employee || row.employeeId !== employee.id)) return res.status(403).json({ message: "You can only manage your own breaks" });
    if (entry.resumedAt) return res.status(409).json({ message: "Work has already resumed" });
    await entry.update({ resumedAt: new Date() });
    await recordAudit(req, "UPDATE", "AttendanceBreak", entry.id, { after: entry });
    res.json(entry);
  } catch (e) { next(e); }
});

export const submissionsRouter = Router();
submissionsRouter.get("/", async (req, res, next) => {
  try {
    const where = supervisoryRoles.includes(req.user.role) ? {} : { submittedById: req.user.id };
    res.json(await SurveySubmission.findAll({
      where,
      include: [SurveyForm, Project, { model: User, as: "submittedBy", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]]
    }));
  } catch (e) { next(e); }
});
submissionsRouter.post("/", async (req, res, next) => {
  try {
    const form = await SurveyForm.findOne({ where: { id: req.body.surveyFormId, active: true } });
    if (!form) return res.status(400).json({ message: "Select an active survey form" });
    if (req.body.projectId && !(await Project.findByPk(req.body.projectId))) {
      return res.status(400).json({ message: "Selected project was not found" });
    }
    const answers = req.body.answers && typeof req.body.answers === "object" ? req.body.answers : {};
    const missing = (form.fields || []).filter(field => field.required && (answers[field.key] === undefined || answers[field.key] === ""));
    if (missing.length) return res.status(400).json({ message: `Required answers missing: ${missing.map(field => field.label).join(", ")}` });
    const row = await SurveySubmission.create({
      surveyFormId: form.id,
      projectId: req.body.projectId || null,
      answers,
      latitude: req.body.latitude || null,
      longitude: req.body.longitude || null,
      status: "SUBMITTED",
      submittedById: req.user.id
    });
    await recordAudit(req, "CREATE", "SurveySubmission", row.id, { after: row });
    res.status(201).json(row);
  } catch (e) { next(e); }
});
