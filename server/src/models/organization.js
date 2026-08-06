import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { common } from "./common.js";

export const User = sequelize.define("User", {
  ...common, name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM("ADMIN", "MANAGER", "HR", "SURVEYOR", "EMPLOYEE", "MARKETING_EXECUTIVE", "MARKETING_MANAGER"), defaultValue: "EMPLOYEE" },
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
}, { indexes: [{ fields: ["status"] }, { fields: ["priority"] }, { fields: ["due_date"] }, { fields: ["title"] }] });
export const Notification = sequelize.define("Notification", {
  ...common,
  type: { type: DataTypes.STRING(40), allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  readAt: DataTypes.DATE
}, { indexes: [{ fields: ["user_id", "read_at"] }, { fields: ["user_id", "created_at", "id"] }] });
export const Attendance = sequelize.define("Attendance", {
  ...common, workDate: { type: DataTypes.DATEONLY, allowNull: false }, checkIn: { type: DataTypes.DATE, allowNull: false },
  checkOut: DataTypes.DATE, latitude: DataTypes.DECIMAL(10, 7), longitude: DataTypes.DECIMAL(10, 7),
  locationAccuracy: DataTypes.DECIMAL(10, 2), notes: DataTypes.STRING, workDescription: DataTypes.TEXT
}, { indexes: [{ unique: true, fields: ["employee_id", "work_date"] }] });
export const AttendanceBreak = sequelize.define("AttendanceBreak", {
  ...common,
  breakType: { type: DataTypes.ENUM("TEA", "LUNCH", "PERSONAL", "OTHER"), defaultValue: "TEA" },
  startedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  resumedAt: DataTypes.DATE,
  notes: DataTypes.STRING
}, { indexes: [{ fields: ["attendance_id", "started_at"] }, { fields: ["resumed_at"] }] });
