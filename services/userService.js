const sequelize = require("sequelize");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const User = require("./../models/User");
const VerificationCode = require("./../models/VerificationCode");

const secretKey = "some-secret-key";

async function createUser(username, password, name, email, phone, dob) {
  try {
    const uniqueUsername = await isUniqueUsername(username);
    const uniqueEmail = await isUniqueEmail(email);

    if (!uniqueUsername) {
      return { success: false, message: "Username already exists" };
    }

    if (!uniqueEmail) {
      return { success: false, message: "Email already exists" };
    }

    const verificationCode = await generateVerificationCode();
    const user = { username, password, name, email, phone, dob };
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    const createdUser = await User.create({
      username: user.username,
      password: user.password,
      name: user.name,
      email: user.email,
      phone: user.phone,
      date_of_birth: user.dob,
    });

    await VerificationCode.create({
      userId: createdUser.id,
      code: verificationCode,
      expiresAt,
    });

    await sendVerificationCode(user.email, verificationCode);

    console.log("New user created", createdUser.toJSON());
    return { success: true, user: createdUser.toJSON() };
  } catch (error) {
    console.error("Error details:", error);

    if (error instanceof sequelize.ValidationError) {
      const messages = error.errors.map((e) => e.message).join(", ");
      console.log("Validation Error Messages:", messages);
      return {
        success: false,
        message: messages,
      };
    } else if (error instanceof sequelize.DatabaseError) {
      console.log("Database Error");
      return { success: false, message: error.message };
    } else {
      console.log("Unknown Error");
      return { success: false, message: "Error creating new user" };
    }
  }
}

async function updateUser(id, updatedData) {
  try {
    const [updated] = await User.update(updatedData, { where: { id } });
    if (updated) {
      return { success: true, message: "User updated" };
    } else {
      return { success: false, message: "User not found" };
    }
  } catch (error) {
    if (error instanceof sequelize.UniqueConstraintError) {
      return {
        success: false,
        message:
          "Email or username already exists. Please use a different email or username.",
      };
    } else if (error instanceof sequelize.ValidationError) {
      return {
        success: false,
        message: error.errors.map((e) => e.message).join(", "),
      };
    } else if (error instanceof sequelize.DatabaseError) {
      return { success: false, message: error.message };
    } else {
      return { success: false, message: "Error updating user" };
    }
  }
}

async function deleteUserById(id) {
  try {
    const user = await User.findOne({ where: { id } });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (user.role === "admin") {
      return { success: false, message: "Cannot delete admin user" };
    }

    await User.destroy({ where: { id } });

    return { success: true, message: "User deleted" };
  } catch (error) {
    if (error instanceof sequelize.DatabaseError) {
      console.error("Database error", error.message);
      return { success: false, message: error.message };
    } else {
      console.error("Error deleting user", error);
      return { success: false, message: "Error deleting user" };
    }
  }
}

async function getAllUsers(limit = 10, offset = 0) {
  try {
    const users = await User.findAll({
      where: {
        verified: true,
      },
      order: [["id", "ASC"]],
      limit,
      offset,
    });
    // console.log("All users", JSON.stringify(users, null, 2));
    return users;
  } catch (error) {
    if (error instanceof sequelize.DatabaseError) {
      console.error("Database error", error.message);
    } else {
      console.error("Error getting all users", error);
    }
  }
}

async function getAllUsersWithoutLimit() {
  try {
    const users = await User.findAll({
      where: {
        verified: true,
      },
      order: [["id", "ASC"]],
    });
    // console.log("All users", JSON.stringify(users, null, 2));
    return users;
  } catch (error) {
    if (error instanceof sequelize.DatabaseError) {
      console.error("Database error", error.message);
    } else {
      console.error("Error getting all users", error);
    }
  }
}

async function searchUsers({
  value,
  startDate,
  endDate,
  limit = 10,
  offset = 0,
}) {
  try {
    const where = {};

    if (value) {
      where[sequelize.Op.or] = {
        username: { [sequelize.Op.like]: `%${value}%` },
        email: { [sequelize.Op.like]: `%${value}%` },
        phone: { [sequelize.Op.like]: `%${value}%` },
      };
    }

    if (startDate && endDate) {
      where.date_of_birth = { [sequelize.Op.between]: [startDate, endDate] };
    } else if (startDate && !endDate) {
      where.date_of_birth = { [sequelize.Op.gte]: startDate };
    } else if (!startDate && endDate) {
      where.date_of_birth = { [sequelize.Op.lte]: endDate };
    }

    const users = await User.findAll({
      where,
      limit,
      offset,
    });

    // console.log(
    //   "Users found",
    //   users.map((user) => user.toJSON())
    // );
    return users;
  } catch (error) {
    if (error instanceof sequelize.DatabaseError) {
      console.error("Database error", error.message);
    } else {
      console.error("Error getting users", error);
    }
    return [];
  }
}

async function isUniqueUsername(username) {
  try {
    const user = await User.findOne({ where: { username } });
    return user === null;
  } catch (error) {
    console.error("Error checking if username is unique", error);
  }
}

async function isUniqueEmail(email) {
  try {
    const user = await User.findOne({ where: { email } });
    return user === null;
  } catch (error) {
    console.error("Error checking if email is unique", error);
  }
}

async function generateVerificationCode() {
  //return crypto.randomBytes(32).toString("hex");
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationCode(email, code) {
  const transporter = nodemailer.createTransport({
    service: "outlook",
    auth: {
      user: "achyn2004@gmail.com",
      pass: "#Andchan201666",
    },
  });

  const mailOptions = {
    from: "achyn2004@gmail.com",
    to: email,
    subject: "Verify your email",
    text: `Your verification code is: ${code}`,
  };

  await transporter.sendMail(mailOptions);
}

async function verifyEmail(code) {
  try {
    const verificationCode = await VerificationCode.findOne({
      where: { code },
    });
    if (!verificationCode) {
      return { success: false, message: "Invalid verification code." };
    }
    const user = await User.findByPk(verificationCode.userId);
    if (!user) {
      return { success: false, message: "User not found." };
    }
    const expiresAt = verificationCode.expiresAt;
    const curTime = new Date();
    const timeDiff = (curTime - expiresAt) / 1000 / 60;
    if (timeDiff > 5) {
      return { success: false, message: "Verification code expired." };
    }

    user.verified = true;
    await user.save();
    await verificationCode.destroy();

    return { success: true, message: "Email verified successfully." };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error verifying email." };
  }
}

async function login(username, password) {
  try {
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return { success: false, message: "User not found." };
    }
    if (!user.verified) {
      return { success: false, message: "Email not verified." };
    }
    const match = await user.verifyPassword(password);
    if (!match) {
      return { success: false, message: "Incorrect password." };
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      secretKey,
      { expiresIn: "10m" }
    );
    console.log(token);

    const decoded = jwt.decode(token);
    console.log(decoded);

    user.last_login = new Date();
    await user.save();

    return { success: true, token, user: user.toJSON() };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error logging in." };
  }
}

function countAllUsers() {
  return User.count();
}

function countAllSearchedUsers({ value, startDate, endDate }) {
  const where = {};

  if (value) {
    where[sequelize.Op.or] = {
      username: { [sequelize.Op.like]: `%${value}%` },
      email: { [sequelize.Op.like]: `%${value}%` },
      phone: { [sequelize.Op.like]: `%${value}%` },
    };
  }

  if (startDate && endDate) {
    where.date_of_birth = { [sequelize.Op.between]: [startDate, endDate] };
  } else if (startDate && !endDate) {
    where.date_of_birth = { [sequelize.Op.gte]: startDate };
  } else if (!startDate && endDate) {
    where.date_of_birth = { [sequelize.Op.lte]: endDate };
  }

  return User.count({ where });
}

async function deleteInList(ids) {
  try {
    const deletedCount = await User.destroy({
      where: { id: { [sequelize.Op.in]: ids } },
    });
    return { success: true, deletedCount };
  } catch (error) {
    if (error.message === "Admin cannot be deleted") {
      return { success: false, message: "Admin cannot be deleted" };
    }
    return { success: false, message: "An error occured during deletion" };
  }
}

function searchConditionForId(idQuery) {
  const [option, value] = idQuery.split(":");
  if (option === "greaterOrEquals") {
    return { [sequelize.Op.gte]: value };
  } else if (option === "lessOrEquals") {
    return { [sequelize.Op.lte]: value };
  }
  return null;
}

function searchConditionForUsername(usernameQuery) {
  const [option, value] = usernameQuery.split(":");

  if (option === "startsWith") {
    return { [sequelize.Op.like]: `${value}%` };
  } else if (option === "endsWith") {
    return { [sequelize.Op.like]: `%${value}` };
  } else if (option === "contains") {
    return { [sequelize.Op.like]: `%${value}%` };
  }
  return null;
}

function searchConditionForName(nameQuery) {
  const [option, value] = nameQuery.split(":");
  if (option === "startsWith") {
    return { [sequelize.Op.like]: `${value}%` };
  } else if (option === "endsWith") {
    return { [sequelize.Op.like]: `%${value}` };
  } else if (option === "contains") {
    return { [sequelize.Op.like]: `%${value}%` };
  }
  return null;
}

function searchConditionForEmail(emailQuery) {
  const [option, value] = emailQuery.split(":");
  if (option === "startsWith") {
    return { [sequelize.Op.like]: `${value}%` };
  } else if (option === "endsWith") {
    return { [sequelize.Op.like]: `%${value}` };
  } else if (option === "contains") {
    return { [sequelize.Op.like]: `%${value}%` };
  }
  return null;
}

function searchConditionForPhone(phoneQuery) {
  const [option, value] = phoneQuery.split(":");
  if (option === "startsWith") {
    return { [sequelize.Op.like]: `${value}%` };
  } else if (option === "endsWith") {
    return { [sequelize.Op.like]: `%${value}` };
  } else if (option === "contains") {
    return { [sequelize.Op.like]: `%${value}%` };
  }
  return null;
}

function searchConditionForDob(dateQuery) {
  const [option, value] = dateQuery.split(":");
  if (option === "startsFrom") {
    return { [sequelize.Op.gte]: value };
  } else if (option === "endsTo") {
    return { [sequelize.Op.lte]: value };
  }
  return null;
}

function searchConditionForRole(roleQuery) {
  const option = roleQuery;
  if (option === "user") {
    return { [sequelize.Op.eq]: "user" };
  } else if (option === "admin") {
    return { [sequelize.Op.eq]: "admin" };
  }
  return null;
}

function searchConditionForLastLogin(lastLoginQuery) {
  const [option, value] = lastLoginQuery.split(":");
  if (option === "startsFrom") {
    return { [sequelize.Op.gte]: value };
  } else if (option === "endsTo") {
    return { [sequelize.Op.lte]: value };
  }
  return null;
}

function searchConditionForCreatedAt(createdAtQuery) {
  const [option, value] = createdAtQuery.split(":");
  if (option === "startsFrom") {
    return { [sequelize.Op.gte]: value };
  } else if (option === "endsTo") {
    return { [sequelize.Op.lte]: value };
  }
  return null;
}

function searchConditionToSearchUsers(value, startDate, endDate) {
  try {
    const where = {};

    if (value) {
      where[sequelize.Op.or] = {
        username: { [sequelize.Op.like]: `%${value}%` },
        email: { [sequelize.Op.like]: `%${value}%` },
        phone: { [sequelize.Op.like]: `%${value}%` },
      };
    }

    if (startDate && endDate) {
      where.date_of_birth = { [sequelize.Op.between]: [startDate, endDate] };
    } else if (startDate && !endDate) {
      where.date_of_birth = { [sequelize.Op.gte]: startDate };
    } else if (!startDate && endDate) {
      where.date_of_birth = { [sequelize.Op.lte]: endDate };
    }
    return where;
  } catch (error) {
    console.log(error);
  }
}

function countAllUsersWithCriteria(where) {
  return User.count({ where });
}

function getAllUsersWithCriteria(limit, offset, where) {
  return User.findAll({ where, order: [["id", "ASC"]], limit, offset });
}

module.exports = {
  createUser,
  getAllUsers,
  updateUser,
  deleteUserById,
  verifyEmail,
  login,
  countAllUsers,
  countAllSearchedUsers,
  searchUsers,
  deleteInList,
  getAllUsersWithoutLimit,
  searchConditionForId,
  searchConditionForUsername,
  searchConditionForName,
  searchConditionForEmail,
  searchConditionForPhone,
  searchConditionForDob,
  searchConditionForRole,
  searchConditionForLastLogin,
  searchConditionForCreatedAt,
  searchConditionToSearchUsers,
  countAllUsersWithCriteria,
  getAllUsersWithCriteria,
};
