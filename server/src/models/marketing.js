import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { common } from "./common.js";

export const MarketingOpportunity = sequelize.define("MarketingOpportunity", {
  ...common,
  title: { type: DataTypes.STRING, allowNull: false },
  clientName: { type: DataTypes.STRING, allowNull: false },
  contactPerson: DataTypes.STRING,
  contactEmail: DataTypes.STRING,
  enquiryNumber: DataTypes.STRING,
  source: { type: DataTypes.ENUM("GEM", "CPPP", "EPROCURE", "PRIVATE_ENQUIRY", "EXISTING_CLIENT", "EMAIL", "WEBSITE", "LINKEDIN", "PARTNER", "OTHER"), defaultValue: "OTHER" },
  sourceLink: DataTypes.TEXT,
  scope: DataTypes.TEXT,
  location: DataTypes.STRING,
  service: DataTypes.STRING,
  estimatedValue: DataTypes.DECIMAL(15, 2),
  submissionDeadline: DataTypes.DATE,
  emdAmount: DataTypes.DECIMAL(15, 2),
  tenderFee: DataTypes.DECIMAL(15, 2),
  eligibilityCriteria: DataTypes.TEXT,
  documentLinks: DataTypes.TEXT,
  assignedExecutiveId: DataTypes.UUID,
  status: { type: DataTypes.ENUM("NEW", "SCREENING", "MANAGER_REVIEW", "ADMIN_REVIEW", "BID_APPROVED", "BID_PREPARATION", "SUBMITTED", "TECHNICAL_EVALUATION", "QUALIFIED", "FINANCIAL_EVALUATION", "NEGOTIATION", "AWARDED", "LOST", "NO_BID", "HOLD"), defaultValue: "NEW" },
  screeningRecommendation: DataTypes.ENUM("BID_RECOMMENDED", "NO_BID_RECOMMENDED", "MORE_INFORMATION_REQUIRED", "HOLD"),
  screeningNotes: DataTypes.TEXT,
  managerDecision: DataTypes.ENUM("RECOMMEND_GO", "RECOMMEND_NO_BID", "RETURN_TO_EXECUTIVE", "HOLD"),
  managerNotes: DataTypes.TEXT,
  adminDecision: DataTypes.ENUM("GO_FOR_BID", "NO_BID", "HOLD", "APPROVE_WITH_CONDITIONS", "RETURN_TO_MANAGER"),
  adminNotes: DataTypes.TEXT,
  quotedValue: DataTypes.DECIMAL(15, 2),
  portalName: DataTypes.STRING,
  bidReference: DataTypes.STRING,
  submittedAt: DataTypes.DATE,
  submissionReceipt: DataTypes.TEXT,
  resultReason: DataTypes.TEXT,
  nextFollowUpAt: DataTypes.DATE,
  convertedProjectId: DataTypes.UUID
}, { indexes: [{ fields: ["status"] }, { fields: ["submission_deadline"] }, { fields: ["assigned_executive_id"] }] });

export const BidCostItem = sequelize.define("BidCostItem", {
  ...common,
  category: { type: DataTypes.ENUM("MANPOWER", "EQUIPMENT", "TRAVEL", "SOFTWARE", "VENDOR", "EMD_BG", "OVERHEAD", "CONTINGENCY", "PROFIT", "TAX", "OTHER"), defaultValue: "OTHER" },
  description: { type: DataTypes.STRING, allowNull: false },
  quantity: { type: DataTypes.DECIMAL(12, 2), defaultValue: 1 },
  rate: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false }
});

export const MarketingActivity = sequelize.define("MarketingActivity", {
  ...common,
  activityType: { type: DataTypes.ENUM("CALL", "EMAIL", "MEETING", "FOLLOW_UP", "CLARIFICATION", "PRESENTATION", "NEGOTIATION", "NOTE"), defaultValue: "NOTE" },
  details: { type: DataTypes.TEXT, allowNull: false },
  occurredAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  nextFollowUpAt: DataTypes.DATE,
  createdByUserId: DataTypes.UUID
});

