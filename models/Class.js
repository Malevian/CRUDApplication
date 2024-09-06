const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Class = sequelize.define(
  "Class",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: "Class name already exists",
      },
      validate: {
        notEmpty: {
          msg: "Class name cannot be empty",
        },
      },
    },
    description: {
      type: DataTypes.STRING,
    },
    creationDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    startDate: {
      type: DataTypes.DATE,
    },
    endDate: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "Class",
    timestamps: false,
  }
);

//Class.sync({ alter: true });

module.exports = Class;
