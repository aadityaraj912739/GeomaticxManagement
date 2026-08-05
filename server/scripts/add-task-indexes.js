import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../.env") });

const { sequelize } = await import("../src/config/database.js");
const { Notification, Task } = await import("../src/models/registry.js");
const queryInterface = sequelize.getQueryInterface();
const table = Task.getTableName();
const field = attribute => Task.rawAttributes[attribute].field;
const desired = [
  { name: "tasks_status_due", fields: [field("status"), field("dueDate")] },
  { name: "tasks_assignee_status_due", fields: [field("assigneeId"), field("status"), field("dueDate")] },
  { name: "tasks_project_status", fields: [field("ProjectId"), field("status")] },
  { name: "tasks_priority", fields: [field("priority")] },
  { name: "tasks_title", fields: [field("title")] }
];

try {
  await sequelize.authenticate();
  const existing = new Set((await queryInterface.showIndex(table)).map(index => index.name));
  for (const index of desired) {
    if (!existing.has(index.name)) await queryInterface.addIndex(table, index.fields, { name: index.name });
  }
  const notificationTable = Notification.getTableName();
  const notificationIndexes = await queryInterface.showIndex(notificationTable);
  const notificationFields = [Notification.rawAttributes.userId.field, Notification.rawAttributes.createdAt.field, Notification.rawAttributes.id.field];
  const hasNotificationCursorIndex = notificationIndexes.some(index =>
    notificationFields.every((value, position) => index.fields[position]?.attribute === value)
  );
  if (!hasNotificationCursorIndex) {
    await queryInterface.addIndex(notificationTable, notificationFields, { name: "notifications_user_created_id" });
  }
  console.log("Task and notification query indexes are ready.");
} finally {
  await sequelize.close();
}
