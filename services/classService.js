const { sequelize, Op } = require("sequelize");
const { Class, User, Class_User } = require("../models/setupAssociations");

async function addNewClass(
  name,
  description,
  creationDate,
  startDate,
  endDate
) {
  try {
    const newClass = await Class.create({
      name,
      description,
      creationDate,
      startDate,
      endDate,
    });

    console.log("New class added:", newClass);

    return newClass;
  } catch (error) {
    console.error("Error adding new class:", error);
  }
}

async function removeClass(classId) {
  try {
    await removeClassFromUsers(classId);

    await Class.destroy({ where: { id: classId } });
    console.log(`Class with ID ${classId} has been removed`);
  } catch (error) {
    console.error("Error removing class:", error);
  }
}

async function getAllClasses() {
  try {
    const classes = await Class.findAll();
    return classes;
  } catch (error) {
    console.error("Error getting all classes:", error);
    return [];
  }
}

async function getClassById(classId) {
  try {
    const classDetails = await Class.findByPk(classId);
    return classDetails;
  } catch (error) {
    console.error("Error getting class details:", error);
    return null;
  }
}

async function removeClassFromUsers(classId) {
  try {
    const users = await getAllUsersInClass(classId);

    for (const user of users) {
      await user.removeClass(classId);
    }

    console.log(`Class with ID ${classId} has been removed from all users`);
  } catch (error) {
    console.error("Error removing class from users:", error);
  }
}

async function addUserToClass(userId, classId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!(await isExistingClass(classId))) {
      throw new Error("Class not found");
    }

    if (await isInClass(userId, classId)) {
      throw new Error("User already in class");
    }

    await Class_User.create({ userId, classId });

    console.log(
      `User with ID ${userId} has been added to class with ID ${classId}`
    );
  } catch (error) {
    console.error("Error adding user to class:", error);
  }
}

async function addUsersToClass(classId, userIds) {
  try {
    for (const userId of userIds) {
      await addUserToClass(userId, classId);
    }
  } catch (error) {
    console.error("Error adding users to class:", error);
  }
}

async function isExistingClass(classId) {
  return (await Class.findOne({ where: { id: classId } })) !== null;
}

async function isInClass(userId, classId) {
  return (await Class_User.findOne({ where: { userId, classId } })) !== null;
}

async function getAllUsersInClass(classId) {
  const users = await User.findAll({
    include: {
      model: Class,
      where: { id: classId },
    },
  });

  return users;
}

async function getAllUsersNotInClass(classId) {
  const usersInClass = await getAllUsersInClass(classId);
  const userIds = usersInClass.map((user) => user.id);

  const users = await User.findAll({
    where: {
      id: {
        [Op.notIn]: userIds,
      },
    },
  });

  console.log("Users not in class:", users);

  return users;
}

async function countAllUsersInClass(classId) {
  return getAllUsersInClass(classId).then((users) => users.length);
}

module.exports = {
  addNewClass,
  removeClass,
  addUserToClass,
  addUsersToClass,
  getAllUsersInClass,
  getAllUsersNotInClass,
  countAllUsersInClass,
  getAllClasses,
  getClassById,
};
