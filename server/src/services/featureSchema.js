import { DataTypes, QueryTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { Attendance, User } from "../models/registry.js";

// Targeted additive migration for installations that intentionally keep
// SEQUELIZE_SYNC_ALTER disabled. This preserves existing tables and data.
export async function ensureMarketingAttendanceSchema() {
  const queryInterface = sequelize.getQueryInterface();
  const attendanceTable = Attendance.getTableName();
  const attendanceColumns = await queryInterface.describeTable(attendanceTable);
  if (!attendanceColumns.location_accuracy) {
    await queryInterface.addColumn(attendanceTable, "location_accuracy", { type: DataTypes.DECIMAL(10, 2), allowNull: true });
  }
  if (!attendanceColumns.work_description) {
    await queryInterface.addColumn(attendanceTable, "work_description", { type: DataTypes.TEXT, allowNull: true });
  }

  const userTable = User.getTableName();
  const quotedUserTable = queryInterface.queryGenerator.quoteTable(userTable);
  const [roleColumn] = await sequelize.query(`SHOW COLUMNS FROM ${quotedUserTable} WHERE Field = 'role'`, { type: QueryTypes.SELECT });
  if (roleColumn && (!roleColumn.Type.includes("MARKETING_EXECUTIVE") || !roleColumn.Type.includes("MARKETING_MANAGER"))) {
    await queryInterface.changeColumn(userTable, "role", {
      type: DataTypes.ENUM("ADMIN", "MANAGER", "HR", "SURVEYOR", "EMPLOYEE", "MARKETING_EXECUTIVE", "MARKETING_MANAGER"),
      allowNull: true,
      defaultValue: "EMPLOYEE"
    });
  }
}

