import { DataTypes } from "sequelize";

export const common = {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }
};