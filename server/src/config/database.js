import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || "geomaticx_management",
  process.env.MYSQL_USER || "geomaticx",
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    define: { underscored: true, timestamps: true }
  }
);
