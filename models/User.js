const { DataTypes } = require("sequelize");
const sequelize = require("../database");
const bcrypt = require("bcrypt");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: "Username already exists",
      },
      validate: {
        notEmpty: {
          msg: "Username cannot be empty",
        },
        len: {
          args: [3, 30],
          msg: "Username must be between 3 and 30 characters",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Name cannot be empty",
        },
        len: {
          args: [3, 30],
          msg: "Name must be between 3 and 30 characters",
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: "Email already exists",
      },
      validate: {
        notEmpty: {
          msg: "Email cannot be empty",
        },
        isEmail: {
          msg: "Invalid email address",
        },
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "Phone cannot be empty",
        },
        isNumeric: {
          msg: "Invalid phone number",
        },
      },
    },
    date_of_birth: {
      type: DataTypes.DATE,
    },
    role: {
      type: DataTypes.ENUM("admin", "user"),
      defaultValue: "user",
      allowNull: false,
    },
    last_login: {
      type: DataTypes.DATE,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "User",
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeDestroy: async (user) => {
        if (user.role === "admin") {
          throw new Error("Admin cannot be deleted");
        }
      },
    },
  }
);

User.prototype.verifyPassword = async function (password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await bcrypt.compare(password, hashedPassword);
};

User.sync({ alter: true });
module.exports = User;
