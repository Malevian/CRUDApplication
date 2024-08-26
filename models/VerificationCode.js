const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const VerificationCode = sequelize.define(
  "VerificationCode",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: "User",
        key: "id",
      },
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "VerificationCode",
    timestamps: false,
  }
);

VerificationCode.sync({ alter: true });
module.exports = VerificationCode;
