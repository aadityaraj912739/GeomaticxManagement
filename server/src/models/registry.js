export * from "./organization.js";
export * from "./operations.js";

import {
  Attendance,
  Client,
  Department,
  Designation,
  Employee,
  Notification,
  Office,
  Project,
  Task,
  User
} from "./organization.js";
import {
  AiRecord,
  AiInference,
  AssetRecord,
  AuditLog,
  CommercialRecord,
  ProcessingJob,
  QcApproval,
  SecurityRegister,
  SpatialRecord,
  SurveyForm,
  SurveySubmission
} from "./operations.js";

Department.hasMany(Employee, { foreignKey: { name: "departmentId", field: "department_id" } }); Employee.belongsTo(Department, { foreignKey: { name: "departmentId", field: "department_id" } });
Office.hasMany(Employee, { foreignKey: { name: "officeId", field: "office_id" } }); Employee.belongsTo(Office, { foreignKey: { name: "officeId", field: "office_id" } });
Designation.hasMany(Employee, { foreignKey: { name: "designationId", field: "designation_id" } }); Employee.belongsTo(Designation, { foreignKey: { name: "designationId", field: "designation_id" } });
User.hasOne(Employee, { foreignKey: { name: "userId", field: "user_id" } }); Employee.belongsTo(User, { foreignKey: { name: "userId", field: "user_id" } });
Employee.hasMany(Employee, { as: "directReports", foreignKey: { name: "reportingManagerId", field: "reporting_manager_id" } });
Employee.belongsTo(Employee, { as: "reportingManager", foreignKey: { name: "reportingManagerId", field: "reporting_manager_id" } });
Client.hasMany(Project, { foreignKey: { name: "ClientId", field: "ClientId" } }); Project.belongsTo(Client, { foreignKey: { name: "ClientId", field: "ClientId" } });
User.hasMany(Project, { foreignKey: { name: "managerId", field: "managerId" } }); Project.belongsTo(User, { as: "manager", foreignKey: { name: "managerId", field: "managerId" } });
Project.hasMany(Task, { foreignKey: { name: "ProjectId", field: "ProjectId" } }); Task.belongsTo(Project, { foreignKey: { name: "ProjectId", field: "ProjectId" } });
User.hasMany(Task, { foreignKey: { name: "assigneeId", field: "assigneeId" } }); Task.belongsTo(User, { as: "assignee", foreignKey: { name: "assigneeId", field: "assigneeId" } });
User.hasMany(Notification, { foreignKey: { name: "userId", field: "user_id" }, onDelete: "CASCADE" }); Notification.belongsTo(User, { foreignKey: { name: "userId", field: "user_id" } });
Task.hasMany(Notification, { foreignKey: { name: "taskId", field: "task_id" }, onDelete: "CASCADE" }); Notification.belongsTo(Task, { foreignKey: { name: "taskId", field: "task_id" } });
Employee.hasMany(Attendance, { foreignKey: { name: "employeeId", field: "employee_id" } }); Attendance.belongsTo(Employee, { foreignKey: { name: "employeeId", field: "employee_id" } });
SurveyForm.hasMany(SurveySubmission, { foreignKey: { name: "surveyFormId", field: "survey_form_id" } }); SurveySubmission.belongsTo(SurveyForm, { foreignKey: { name: "surveyFormId", field: "survey_form_id" } });
Project.hasMany(SurveySubmission, { foreignKey: { name: "projectId", field: "project_id" } }); SurveySubmission.belongsTo(Project, { foreignKey: { name: "projectId", field: "project_id" } });
User.hasMany(SurveySubmission, { foreignKey: { name: "submittedById", field: "submitted_by_id" } }); SurveySubmission.belongsTo(User, { as: "submittedBy", foreignKey: { name: "submittedById", field: "submitted_by_id" } });
Project.hasMany(SpatialRecord, { foreignKey: { name: "projectId", field: "project_id" } }); SpatialRecord.belongsTo(Project, { foreignKey: { name: "projectId", field: "project_id" } });
Project.hasMany(ProcessingJob, { foreignKey: { name: "projectId", field: "project_id" } }); ProcessingJob.belongsTo(Project, { foreignKey: { name: "projectId", field: "project_id" } });
Project.hasMany(AssetRecord, { foreignKey: { name: "projectId", field: "project_id" } }); AssetRecord.belongsTo(Project, { foreignKey: { name: "projectId", field: "project_id" } });
Project.hasMany(CommercialRecord, { foreignKey: { name: "projectId", field: "project_id" } }); CommercialRecord.belongsTo(Project, { foreignKey: { name: "projectId", field: "project_id" } });
Project.hasMany(QcApproval, { foreignKey: { name: "projectId", field: "project_id" } }); QcApproval.belongsTo(Project, { foreignKey: { name: "projectId", field: "project_id" } });
Project.hasMany(AiRecord, { foreignKey: { name: "projectId", field: "project_id" } }); AiRecord.belongsTo(Project, { foreignKey: { name: "projectId", field: "project_id" } });
Project.hasMany(AiInference, { foreignKey: { name: "projectId", field: "project_id" } }); AiInference.belongsTo(Project, { foreignKey: { name: "projectId", field: "project_id" } });
User.hasMany(AiInference, { as: "requestedAiInferences", foreignKey: { name: "requestedByUserId", field: "requested_by_user_id" } }); AiInference.belongsTo(User, { as: "requestedBy", foreignKey: { name: "requestedByUserId", field: "requested_by_user_id" } });
User.hasMany(AiInference, { as: "reviewedAiInferences", foreignKey: { name: "reviewedByUserId", field: "reviewed_by_user_id" } }); AiInference.belongsTo(User, { as: "reviewedBy", foreignKey: { name: "reviewedByUserId", field: "reviewed_by_user_id" } });
Project.hasMany(SecurityRegister, { foreignKey: { name: "projectId", field: "project_id" } }); SecurityRegister.belongsTo(Project, { foreignKey: { name: "projectId", field: "project_id" } });
User.hasMany(AuditLog, { foreignKey: { name: "actorId", field: "actorId" } }); AuditLog.belongsTo(User, { as: "actor", foreignKey: { name: "actorId", field: "actorId" } });

export const models = { User, Department, Office, Designation, Employee, Client, Project, Task, Notification, Attendance, SurveyForm, SurveySubmission, SpatialRecord, ProcessingJob, AssetRecord, CommercialRecord, QcApproval, AiRecord, AiInference, SecurityRegister, AuditLog };
