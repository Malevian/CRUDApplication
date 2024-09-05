const sequelize = require("sequelize");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const User = require("./../models/User");
const VerificationCode = require("./../models/VerificationCode");
const { convertToYYYYMMDD } = require("./../utilities/dateUtils");

const secretKey = "some-secret-key";

async function createUser(username, password, name, email, phone, dob) {
  try {
    const [uniqueUsername, uniqueEmail] = await Promise.all([
      isUniqueUsername(username),
      isUniqueEmail(email),
    ]);

    if (!uniqueUsername) {
      return { success: false, message: "Username already exists" };
    }

    if (!uniqueEmail) {
      return { success: false, message: "Email already exists" };
    }

    const verificationCode = await generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const user = await User.create({
      username,
      password,
      name,
      email,
      phone,
      date_of_birth: dob,
    });

    await VerificationCode.create({
      userId: user.id,
      code: verificationCode,
      expiresAt,
    });

    await sendVerificationCode(user.email, verificationCode);

    console.log("New user created", user.toJSON());
    return { success: true, user: user.toJSON() };
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

async function isUniqueUsername(username) {
  try {
    const user = await User.findOne({ where: { username } });
    return user === null;
  } catch (error) {
    console.error("Error checking if username is unique", error);
    return false;
  }
}

async function isUniqueEmail(email) {
  try {
    const user = await User.findOne({ where: { email } });
    return user === null;
  } catch (error) {
    console.error("Error checking if email is unique", error);
    return false;
  }
}

async function generateVerificationCode() {
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

    const curTime = new Date();
    if (curTime > verificationCode.expiresAt) {
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

async function deleteInList(ids) {
  try {
    const admins = await User.findAll({
      where: {
        id: { [sequelize.Op.in]: ids },
        role: "admin",
      },
    });

    if (admins.length > 0) {
      return { success: false, message: "The list contains admin(s)" };
    }
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

function createSearchCondition(query, isDate = false) {
  const [option, value] = query.split(":");

  if (isDate) {
    let [startDate, endDate] = value.split("_").map(convertToYYYYMMDD);
    const dateConditions = {
      startsFrom: { [sequelize.Op.gte]: startDate },
      endsTo: { [sequelize.Op.lte]: endDate },
      between: { [sequelize.Op.between]: [startDate, endDate] },
    };
    return dateConditions[option];
  }

  const conditions = {
    greaterOrEquals: { [sequelize.Op.gte]: value },
    lessOrEquals: { [sequelize.Op.lte]: value },
    startsWith: { [sequelize.Op.iLike]: `${value}%` },
    endsWith: { [sequelize.Op.iLike]: `%${value}` },
    contains: { [sequelize.Op.iLike]: `%${value}%` },
    eq: { [sequelize.Op.eq]: value },
  };
  return conditions[option] || null;
}

function searchConditionToSearchUsers(value, startDate, endDate) {
  try {
    const where = {};

    if (value) {
      where[sequelize.Op.or] = ["username", "name", "email", "phone"].map(
        (field) => ({ [field]: { [sequelize.Op.like]: `%${value}%` } })
      );
    }

    if (startDate || endDate) {
      startDate = startDate ? convertToYYYYMMDD(startDate) : null;
      endDate = endDate ? convertToYYYYMMDD(endDate) : null;

      where.date_of_birth = {
        ...(startDate && { [sequelize.Op.gte]: startDate }),
        ...(endDate && { [sequelize.Op.lte]: endDate }),
        ...(startDate &&
          endDate && { [sequelize.Op.between]: [startDate, endDate] }),
      };
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

async function registerUser(username, password, name, email, phone, dob) {
  try {
    const [uniqueUsername, uniqueEmail] = await Promise.all([
      isUniqueUsername(username),
      isUniqueEmail(email),
    ]);

    if (!uniqueUsername) {
      return { success: false, message: "Username already exists" };
    }

    if (!uniqueEmail) {
      return { success: false, message: "Email already exists" };
    }

    const verificationCode = await generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const user = await User.create({
      username,
      password,
      name,
      email,
      phone,
      date_of_birth: dob,
    });

    await VerificationCode.create({
      userId: user.id,
      code: verificationCode,
      expiresAt,
    });

    await sendVerificationCode(user.email, verificationCode);

    console.log("New user created", user.toJSON());
    return { success: true, user: user.toJSON() };
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

module.exports = {
  createUser,
  updateUser,
  deleteUserById,
  verifyEmail,
  login,
  deleteInList,
  getAllUsersWithoutLimit,
  searchConditionToSearchUsers,
  countAllUsersWithCriteria,
  getAllUsersWithCriteria,
  registerUser,
  createSearchCondition,
};
