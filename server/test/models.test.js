import test from "node:test";
import assert from "node:assert/strict";
import { AiInference, AiRecord, AssetRecord, Attendance, AuditLog, CommercialRecord, Designation, Employee, Notification, Office, ProcessingJob, Project, QcApproval, SecurityRegister, SpatialRecord, SurveyForm, SurveySubmission, Task, User, models } from "../src/models/registry.js";

test("organization foundation models are registered", () => {
  for (const name of ["Office", "Department", "Designation", "Employee", "Notification", "SpatialRecord", "ProcessingJob", "AssetRecord", "CommercialRecord", "QcApproval", "AiRecord", "AiInference", "SecurityRegister", "AuditLog"]) {
    assert.equal(typeof models[name], "function");
  }
});

test("task notifications belong to their recipient and task", () => {
  assert.equal(Notification.associations.User.target, User);
  assert.equal(Notification.associations.User.foreignKey, "userId");
  assert.equal(Notification.associations.Task.target, Task);
  assert.equal(Notification.associations.Task.foreignKey, "taskId");
  assert.equal(Task.associations.Notifications.target, Notification);
});

test("employees connect to organization and reporting hierarchy", () => {
  assert.equal(Employee.associations.Office.target, Office);
  assert.equal(Employee.associations.Designation.target, Designation);
  assert.equal(Employee.associations.User.target, User);
  assert.equal(Employee.associations.reportingManager.target, Employee);
  assert.equal(Employee.associations.directReports.target, Employee);
  assert.equal(Employee.associations.Office.foreignKey, "officeId");
  assert.equal(Employee.associations.Department.foreignKey, "departmentId");
  assert.equal(Employee.associations.Designation.foreignKey, "designationId");
  assert.equal(Employee.associations.User.foreignKey, "userId");
  assert.equal(Employee.associations.reportingManager.foreignKey, "reportingManagerId");
});

test("audit logs identify their acting user", () => {
  assert.equal(AuditLog.associations.actor.target, User);
  assert.equal(AuditLog.options.updatedAt, false);
});

test("employee self-service records use consistent relationship fields", () => {
  assert.equal(Attendance.associations.Employee.foreignKey, "employeeId");
  const attendanceIndex = Attendance.options.indexes.find(index => index.unique);
  assert.deepEqual(attendanceIndex.fields, ["employee_id", "work_date"]);
  assert.equal(SurveySubmission.associations.SurveyForm.target, SurveyForm);
  assert.equal(SurveySubmission.associations.SurveyForm.foreignKey, "surveyFormId");
  assert.equal(SurveySubmission.associations.Project.foreignKey, "projectId");
  assert.equal(SurveySubmission.associations.submittedBy.foreignKey, "submittedById");
});

test("new operational records attach to projects", () => {
  assert.equal(SpatialRecord.associations.Project.target, Project);
  assert.equal(ProcessingJob.associations.Project.target, Project);
  assert.equal(AssetRecord.associations.Project.target, Project);
  assert.equal(CommercialRecord.associations.Project.target, Project);
  assert.equal(QcApproval.associations.Project.target, Project);
  assert.equal(AiRecord.associations.Project.target, Project);
  assert.equal(AiInference.associations.Project.target, Project);
  assert.equal(AiInference.associations.requestedBy.target, User);
  assert.equal(AiInference.associations.reviewedBy.target, User);
  assert.equal(SecurityRegister.associations.Project.target, Project);
});
