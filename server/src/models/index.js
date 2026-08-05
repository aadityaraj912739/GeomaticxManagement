import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const common = { id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true } };
export const User = sequelize.define("User", {
  ...common, name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM("ADMIN", "MANAGER", "HR", "SURVEYOR", "EMPLOYEE"), defaultValue: "EMPLOYEE" },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
});
export const Department = sequelize.define("Department", {
  ...common, name: { type: DataTypes.STRING, allowNull: false, unique: true }, code: { type: DataTypes.STRING, unique: true }, description: DataTypes.TEXT
});
export const Office = sequelize.define("Office", {
  ...common, name: { type: DataTypes.STRING, allowNull: false, unique: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true }, address: DataTypes.TEXT,
  city: DataTypes.STRING, state: DataTypes.STRING, phone: DataTypes.STRING,
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
});
export const Designation = sequelize.define("Designation", {
  ...common, name: { type: DataTypes.STRING, allowNull: false, unique: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true }, level: DataTypes.INTEGER,
  description: DataTypes.TEXT, active: { type: DataTypes.BOOLEAN, defaultValue: true }
});
export const Employee = sequelize.define("Employee", {
  ...common, employeeCode: { type: DataTypes.STRING, allowNull: false, unique: true },
  firstName: { type: DataTypes.STRING, allowNull: false }, lastName: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true }, phone: DataTypes.STRING,
  joiningDate: DataTypes.DATEONLY, employmentType: DataTypes.STRING,
  status: { type: DataTypes.ENUM("ACTIVE", "INACTIVE", "ON_LEAVE", "EXITED"), defaultValue: "ACTIVE" }
});
export const Client = sequelize.define("Client", {
  ...common, name: { type: DataTypes.STRING, allowNull: false }, code: { type: DataTypes.STRING, unique: true },
  contactName: DataTypes.STRING, email: DataTypes.STRING, phone: DataTypes.STRING, address: DataTypes.TEXT
});
export const Project = sequelize.define("Project", {
  ...common, code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false }, description: DataTypes.TEXT,
  status: { type: DataTypes.ENUM("PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"), defaultValue: "PLANNED" },
  startDate: DataTypes.DATEONLY, endDate: DataTypes.DATEONLY, budget: DataTypes.DECIMAL(15, 2), location: DataTypes.STRING
});
export const Task = sequelize.define("Task", {
  ...common, title: { type: DataTypes.STRING, allowNull: false }, description: DataTypes.TEXT,
  status: { type: DataTypes.ENUM("TODO", "IN_PROGRESS", "REVIEW", "DONE"), defaultValue: "TODO" },
  priority: { type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"), defaultValue: "MEDIUM" },
  dueDate: DataTypes.DATEONLY, progress: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0, max: 100 } }
});
export const Attendance = sequelize.define("Attendance", {
  ...common, workDate: { type: DataTypes.DATEONLY, allowNull: false }, checkIn: { type: DataTypes.DATE, allowNull: false },
  checkOut: DataTypes.DATE, latitude: DataTypes.DECIMAL(10, 7), longitude: DataTypes.DECIMAL(10, 7), notes: DataTypes.STRING
}, { indexes: [{ unique: true, fields: ["employee_id", "work_date"] }] });
export const SurveyForm = sequelize.define("SurveyForm", {
  ...common, name: { type: DataTypes.STRING, allowNull: false }, description: DataTypes.TEXT,
  fields: { type: DataTypes.JSON, allowNull: false, defaultValue: [] }, active: { type: DataTypes.BOOLEAN, defaultValue: true }
});
export const SurveySubmission = sequelize.define("SurveySubmission", {
  ...common, answers: { type: DataTypes.JSON, allowNull: false }, latitude: DataTypes.DECIMAL(10, 7),
  longitude: DataTypes.DECIMAL(10, 7), status: { type: DataTypes.ENUM("DRAFT", "SUBMITTED", "APPROVED", "REJECTED"), defaultValue: "SUBMITTED" }
});
export const SpatialRecord = sequelize.define("SpatialRecord", {
  ...common,
  projectId: DataTypes.UUID,
  recordType: { type: DataTypes.ENUM("PROJECT_BOUNDARY", "SURVEY_LOCATION", "UTILITY_ASSET", "TOPO_CONTROL", "GPR_TRACE", "GIS_LAYER"), defaultValue: "PROJECT_BOUNDARY" },
  referenceName: { type: DataTypes.STRING, allowNull: false },
  coordinateReferenceSystem: DataTypes.STRING,
  geometryType: { type: DataTypes.ENUM("POINT", "LINESTRING", "POLYGON", "RASTER", "MESH"), defaultValue: "POLYGON" },
  geometryValidationStatus: { type: DataTypes.ENUM("PENDING", "VALID", "WARNINGS", "INVALID"), defaultValue: "PENDING" },
  qcStatus: { type: DataTypes.ENUM("NOT_STARTED", "IN_REVIEW", "PASSED", "FAILED"), defaultValue: "NOT_STARTED" },
  coveragePercent: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0, max: 100 } },
  mapUrl: DataTypes.STRING,
  utilityAssetRef: DataTypes.STRING,
  topoSurveyRef: DataTypes.STRING,
  gprSurveyRef: DataTypes.STRING,
  dgpsRef: DataTypes.STRING,
  totalStationRef: DataTypes.STRING,
  kmlRef: DataTypes.STRING,
  cadRef: DataTypes.STRING,
  gisDeliverableRef: DataTypes.STRING,
  notes: DataTypes.TEXT
});
export const ProcessingJob = sequelize.define("ProcessingJob", {
  ...common,
  projectId: DataTypes.UUID,
  datasetName: { type: DataTypes.STRING, allowNull: false },
  sourceType: { type: DataTypes.ENUM("RAW", "DRONE", "RASTER", "LIDAR", "POINT_CLOUD", "BIM", "3D_TILE"), defaultValue: "RAW" },
  stage: { type: DataTypes.ENUM("REGISTERED", "REQUESTED", "PROCESSING", "QC", "READY", "FAILED"), defaultValue: "REGISTERED" },
  outputType: { type: DataTypes.ENUM("ORTHOMOSAIC", "DSM", "DTM", "DEM", "CLASSIFIED_POINT_CLOUD", "MESH", "3D_TILES", "OTHER"), defaultValue: "OTHER" },
  coordinateSystem: DataTypes.STRING,
  checksum: DataTypes.STRING,
  lineage: DataTypes.TEXT,
  approvalStatus: { type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"), defaultValue: "PENDING" },
  failureReason: DataTypes.TEXT,
  retryCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  approvedByUserId: DataTypes.UUID,
  evidenceRef: DataTypes.STRING,
  notes: DataTypes.TEXT
});
export const AssetRecord = sequelize.define("AssetRecord", {
  ...common,
  assetTag: { type: DataTypes.STRING, allowNull: false, unique: true },
  assetType: { type: DataTypes.ENUM("SURVEY_INSTRUMENT", "VEHICLE", "DRONE", "LIDAR_SENSOR", "GNSS", "TOTAL_STATION", "ACCESSORY", "OTHER"), defaultValue: "SURVEY_INSTRUMENT" },
  serialNumber: DataTypes.STRING,
  status: { type: DataTypes.ENUM("AVAILABLE", "ASSIGNED", "IN_MAINTENANCE", "CALIBRATION_DUE", "RETIRED", "LOST"), defaultValue: "AVAILABLE" },
  custodianEmployeeId: DataTypes.UUID,
  projectId: DataTypes.UUID,
  lastLocation: DataTypes.STRING,
  calibrationDue: DataTypes.DATEONLY,
  maintenanceDue: DataTypes.DATEONLY,
  mobilizationStatus: { type: DataTypes.ENUM("READY", "MOBILIZED", "DEMOBILIZED", "ON_ROUTE"), defaultValue: "READY" },
  damageReport: DataTypes.TEXT,
  movementLog: DataTypes.TEXT,
  notes: DataTypes.TEXT
});
export const CommercialRecord = sequelize.define("CommercialRecord", {
  ...common,
  projectId: DataTypes.UUID,
  workOrderNo: { type: DataTypes.STRING, allowNull: false, unique: true },
  projectValue: DataTypes.DECIMAL(15, 2),
  boqLineItem: DataTypes.STRING,
  billingMilestone: DataTypes.STRING,
  invoiceNo: DataTypes.STRING,
  receivableStatus: { type: DataTypes.ENUM("NOT_BILLED", "BILLED", "PARTIAL", "OVERDUE", "COLLECTED"), defaultValue: "NOT_BILLED" },
  paymentFollowUp: DataTypes.STRING,
  expenseType: { type: DataTypes.ENUM("EMPLOYEE", "VENDOR", "PROCUREMENT", "TRAVEL", "EQUIPMENT", "OTHER"), defaultValue: "OTHER" },
  vendorName: DataTypes.STRING,
  expenseAmount: DataTypes.DECIMAL(15, 2),
  revenueSummary: DataTypes.TEXT,
  costSummary: DataTypes.TEXT,
  purchaseRef: DataTypes.STRING,
  managementDashboardNote: DataTypes.TEXT,
  notes: DataTypes.TEXT
});
export const QcApproval = sequelize.define("QcApproval", {
  ...common,
  projectId: DataTypes.UUID,
  entityType: { type: DataTypes.ENUM("SPATIAL", "PROCESSING", "ASSET", "COMMERCIAL", "DELIVERABLE"), defaultValue: "DELIVERABLE" },
  entityName: { type: DataTypes.STRING, allowNull: false },
  version: DataTypes.STRING,
  makerUserId: DataTypes.UUID,
  checkerUserId: DataTypes.UUID,
  approvedByUserId: DataTypes.UUID,
  reviewerRole: { type: DataTypes.ENUM("SUPERVISOR", "QC", "MANAGER", "CLIENT"), defaultValue: "SUPERVISOR" },
  qcObservation: DataTypes.TEXT,
  rejectionReason: DataTypes.TEXT,
  approvalStatus: { type: DataTypes.ENUM("DRAFT", "SUBMITTED", "REJECTED", "APPROVED", "LOCKED"), defaultValue: "DRAFT" },
  checksum: DataTypes.STRING,
  lineage: DataTypes.TEXT,
  evidenceRef: DataTypes.STRING,
  immutableEventId: { type: DataTypes.STRING, unique: true },
  notes: DataTypes.TEXT
});
export const AiRecord = sequelize.define("AiRecord", {
  ...common,
  projectId: DataTypes.UUID,
  recordType: { type: DataTypes.ENUM("DATASET", "ANNOTATION", "MODEL_PROFILE", "PROVIDER_PROFILE", "IMAGE_EXTRACTION", "INFERENCE_REQUEST", "REVIEW", "GOVERNANCE", "OUTPUT"), defaultValue: "DATASET" },
  title: { type: DataTypes.STRING, allowNull: false },
  providerName: DataTypes.STRING,
  datasetRef: DataTypes.STRING,
  annotationState: { type: DataTypes.ENUM("PENDING", "IN_REVIEW", "APPROVED", "REJECTED"), defaultValue: "PENDING" },
  confidenceScore: DataTypes.DECIMAL(5, 2),
  resultSummary: DataTypes.TEXT,
  approvalStatus: { type: DataTypes.ENUM("DRAFT", "REQUESTED", "APPROVED", "REJECTED"), defaultValue: "DRAFT" },
  outputLineage: DataTypes.TEXT,
  providerSecretRef: DataTypes.STRING,
  retryCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  failureReason: DataTypes.TEXT,
  governanceControl: DataTypes.TEXT,
  notes: DataTypes.TEXT
});
export const SecurityRegister = sequelize.define("SecurityRegister", {
  ...common,
  projectId: DataTypes.UUID,
  registerType: { type: DataTypes.ENUM("ACCESS_REVIEW", "PRIVACY_RETENTION", "INCIDENT", "VULNERABILITY", "SECRET_REFERENCE", "EVIDENCE_VERIFICATION", "RELEASE_GATE", "ADMIN_SEPARATION"), defaultValue: "ACCESS_REVIEW" },
  title: { type: DataTypes.STRING, allowNull: false },
  ownerUserId: DataTypes.UUID,
  status: { type: DataTypes.ENUM("OPEN", "IN_REVIEW", "BLOCKED", "RESOLVED", "CLOSED"), defaultValue: "OPEN" },
  severity: { type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"), defaultValue: "LOW" },
  controlStatus: { type: DataTypes.ENUM("PASS", "WARN", "FAIL"), defaultValue: "WARN" },
  evidenceRef: DataTypes.STRING,
  retentionUntil: DataTypes.DATEONLY,
  secretRef: DataTypes.STRING,
  blockingReason: DataTypes.TEXT,
  notes: DataTypes.TEXT
});
export const AuditLog = sequelize.define("AuditLog", {
  ...common, action: { type: DataTypes.ENUM("CREATE", "UPDATE", "DELETE", "ACTIVATE", "DEACTIVATE"), allowNull: false },
  entityType: { type: DataTypes.STRING, allowNull: false }, entityId: DataTypes.UUID,
  details: DataTypes.JSON, ipAddress: DataTypes.STRING
}, { updatedAt: false });

Department.hasMany(Employee); Employee.belongsTo(Department);
Office.hasMany(Employee); Employee.belongsTo(Office);
Designation.hasMany(Employee); Employee.belongsTo(Designation);
User.hasOne(Employee); Employee.belongsTo(User);
Employee.hasMany(Employee, { as: "directReports", foreignKey: "reportingManagerId" });
Employee.belongsTo(Employee, { as: "reportingManager", foreignKey: "reportingManagerId" });
Client.hasMany(Project); Project.belongsTo(Client);
User.hasMany(Project, { foreignKey: "managerId" }); Project.belongsTo(User, { as: "manager", foreignKey: "managerId" });
Project.hasMany(Task); Task.belongsTo(Project);
User.hasMany(Task, { foreignKey: "assigneeId" }); Task.belongsTo(User, { as: "assignee", foreignKey: "assigneeId" });
Employee.hasMany(Attendance); Attendance.belongsTo(Employee);
SurveyForm.hasMany(SurveySubmission); SurveySubmission.belongsTo(SurveyForm);
Project.hasMany(SurveySubmission); SurveySubmission.belongsTo(Project);
User.hasMany(SurveySubmission, { foreignKey: "submittedById" }); SurveySubmission.belongsTo(User, { as: "submittedBy", foreignKey: "submittedById" });
Project.hasMany(SpatialRecord); SpatialRecord.belongsTo(Project);
Project.hasMany(ProcessingJob); ProcessingJob.belongsTo(Project);
Project.hasMany(AssetRecord); AssetRecord.belongsTo(Project);
Project.hasMany(CommercialRecord); CommercialRecord.belongsTo(Project);
Project.hasMany(QcApproval); QcApproval.belongsTo(Project);
Project.hasMany(AiRecord); AiRecord.belongsTo(Project);
Project.hasMany(SecurityRegister); SecurityRegister.belongsTo(Project);
User.hasMany(AuditLog, { foreignKey: "actorId" }); AuditLog.belongsTo(User, { as: "actor", foreignKey: "actorId" });

export const models = { User, Department, Office, Designation, Employee, Client, Project, Task, Attendance, SurveyForm, SurveySubmission, SpatialRecord, ProcessingJob, AssetRecord, CommercialRecord, QcApproval, AiRecord, SecurityRegister, AuditLog };
