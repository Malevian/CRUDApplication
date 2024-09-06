const { DataTypes, Association } = require("sequelize");
const sequelize = require("../database");

const Class_User = sequelize.define(
  "Class_User",
  {
    classId: {
      type: DataTypes.INTEGER,
      references: {
        model: "Class",
        key: "id",
      },
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: "User",
        key: "id",
      },
      primaryKey: true,
    },
  },
  {
    tableName: "Class_User",
    timestamps: false,
  }
);

Class_User.sync({ alter: true });

module.exports = Class_User;
