const Class = require("./Class");
const User = require("./User");
const Class_User = require("./Class_User");

User.belongsToMany(Class, { through: Class_User, foreignKey: "userId" });
Class.belongsToMany(User, { through: Class_User, foreignKey: "classId" });

module.exports = { User, Class, Class_User };
