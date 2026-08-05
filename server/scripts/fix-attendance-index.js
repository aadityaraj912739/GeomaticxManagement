import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

const { sequelize } = await import("../src/config/database.js");

const tableName = "attendances";
const indexName = "attendances_employee_id_work_date";
const expectedColumns = ["employee_id", "work_date"];

try {
  await sequelize.authenticate();

  const indexes = await sequelize.getQueryInterface().showIndex(tableName);
  const attendanceIndex = indexes.find(index => index.name === indexName);
  const actualColumns = attendanceIndex?.fields.map(field => field.attribute) || [];
  const isCorrect = attendanceIndex?.unique
    && actualColumns.length === expectedColumns.length
    && actualColumns.every((column, position) => column === expectedColumns[position]);

  if (isCorrect) {
    console.log(`Attendance index is already correct: ${indexName} (${expectedColumns.join(", ")})`);
    process.exitCode = 0;
  } else {
    const [duplicates] = await sequelize.query(`
      SELECT employee_id, work_date, COUNT(*) AS row_count
      FROM attendances
      GROUP BY employee_id, work_date
      HAVING COUNT(*) > 1
      LIMIT 1
    `);

    if (duplicates.length) {
      throw new Error("Cannot create attendance unique index: duplicate employee/date rows already exist");
    }

    if (attendanceIndex) {
      await sequelize.query(`
        ALTER TABLE attendances
        DROP INDEX attendances_employee_id_work_date,
        ADD UNIQUE INDEX attendances_employee_id_work_date (employee_id, work_date)
      `);
    } else {
      await sequelize.query(`
        ALTER TABLE attendances
        ADD UNIQUE INDEX attendances_employee_id_work_date (employee_id, work_date)
      `);
    }

    console.log(`Attendance index repaired: ${indexName} (${expectedColumns.join(", ")})`);
  }
} finally {
  await sequelize.close();
}
