import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { common } from "./common.js";

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
export const AiInference = sequelize.define("AiInference", {
  ...common,
  projectId: DataTypes.UUID,
  title: { type: DataTypes.STRING, allowNull: false },
  useCase: {
    type: DataTypes.ENUM("GENERAL_ASSISTANCE", "SURVEY_SUMMARY", "DATA_QUALITY", "RISK_REVIEW", "DOCUMENT_EXTRACTION"),
    defaultValue: "GENERAL_ASSISTANCE"
  },
  prompt: { type: DataTypes.TEXT("long"), allowNull: false },
  promptHash: { type: DataTypes.STRING(64), allowNull: false },
  dataClassification: {
    type: DataTypes.ENUM("PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"),
    defaultValue: "INTERNAL"
  },
  containsPersonalData: { type: DataTypes.BOOLEAN, defaultValue: false },
  providerName: { type: DataTypes.STRING, defaultValue: "OpenAI" },
  modelName: DataTypes.STRING,
  providerResponseId: DataTypes.STRING,
  responseText: DataTypes.TEXT("long"),
  status: {
    type: DataTypes.ENUM("REQUESTED", "RUNNING", "PENDING_REVIEW", "APPROVED", "REJECTED", "BLOCKED", "FAILED"),
    defaultValue: "REQUESTED"
  },
  inputTokens: DataTypes.INTEGER,
  outputTokens: DataTypes.INTEGER,
  totalTokens: DataTypes.INTEGER,
  latencyMs: DataTypes.INTEGER,
  retryCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  requestedByUserId: { type: DataTypes.UUID, allowNull: false },
  reviewedByUserId: DataTypes.UUID,
  reviewNote: DataTypes.TEXT,
  failureReason: DataTypes.TEXT,
  completedAt: DataTypes.DATE,
  reviewedAt: DataTypes.DATE
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
