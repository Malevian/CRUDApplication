const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const bodyParser = require("body-parser");
const {
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
} = require("./services/userService");
const {
  addNewClass,
  addUserToClass,
  addUsersToClass,
  getAllUsersInClass,
  getAllUsersNotInClass,
  countAllUsersInClass,
  removeClass,
  getAllClasses,
  getClassById,
} = require("./services/classService");
const { formatDate, formatDateWithTime } = require("./utilities/dateUtils");
const sequelize = require("./database");
const { exportUsersToExcel } = require("./services/excelService");

const port = 3000;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const secretKey = "some-secret-key";

sequelize.sync({ force: false }).then(() => {
  console.log("Database & tables created!");
});

//verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function authorizeUser(req, res, next) {
  if (req.user.role === "admin") {
    next();
  } else {
    res.sendStatus(403);
  }
}
// Serve the index.html page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/classes", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "classes.html"));
});

// Get all users or search by value
app.get("/users", authenticateToken, async (req, res) => {
  try {
    const {
      value,
      dateFrom,
      dateTo,
      id,
      username,
      name,
      email,
      phone,
      dob,
      role,
      lastLogin,
      createdAt,
    } = req.query;
    const page = parseInt(req.query.page) || 1;

    const limit = 10;
    const offset = (page - 1) * limit;

    let searchCondition = {};

    const addCondition = (key, value, formatter, isDate = false) => {
      if (value && formatter(value, isDate)) {
        searchCondition[key] = formatter(value, isDate);
      }
    };

    if (value || dateFrom || dateTo) {
      Object.assign(
        searchCondition,
        searchConditionToSearchUsers(value, dateFrom, dateTo)
      );
    }

    const fields = [
      { key: "id", value: id },
      { key: "username", value: username },
      { key: "name", value: name },
      { key: "email", value: email },
      { key: "phone", value: phone },
      { key: "date_of_birth", value: dob, isDate: true },
      { key: "role", value: role },
      { key: "last_login", value: lastLogin, isDate: true },
      { key: "created_at", value: createdAt, isDate: true },
    ];

    fields.forEach(({ key, value, isDate }) => {
      addCondition(key, value, createSearchCondition, isDate);
    });

    const allUsersCounter = await countAllUsersWithCriteria(searchCondition);
    let users = await getAllUsersWithCriteria(limit, offset, searchCondition);

    users = users.map((user) => ({
      ...user.toJSON(),
      created_at: formatDateWithTime(user.created_at),
      last_login: formatDateWithTime(user.last_login),
      date_of_birth: formatDate(user.date_of_birth),
    }));

    res.json({
      totalUsers: users.length,
      totalPages: Math.ceil(allUsersCounter / limit),
      users: users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching users");
  }
});

// Create user
app.post(
  "/users/create",
  authenticateToken,
  authorizeUser,
  async (req, res) => {
    const { username, password, name, email, phone, dob } = req.body;

    try {
      const result = await createUser(
        username,
        password,
        name,
        email,
        phone,
        dob
      );
      if (result.success) {
        res.status(201).json({ success: true, user: result.user });
      } else {
        res.status(400).json({ success: false, message: result.message });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Error creating user" });
    }
  }
);

// Update user
app.post("/users/update/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { username, password, name, email, phone, dob } = req.body;

  try {
    const result = await updateUser(id, {
      username,
      password,
      name,
      email,
      phone,
      dob,
    });
    if (result.success) {
      res.status(201).json({ success: true, user: result.user });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating user" });
  }
});

// Delete user
app.post(
  "/users/delete/:id",
  authenticateToken,
  authorizeUser,
  async (req, res) => {
    const { id } = req.params;
    try {
      const result = await deleteUserById(id);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).send({ success: false, message: "Error deleting user" });
    }
  }
);

app.post("/verify-email/", async (req, res) => {
  const { code } = req.body;
  try {
    const result = await verifyEmail(code);
    if (result.success) {
      res.status(201).json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error verifying email" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const result = await login(username, password);
  if (result.success) {
    const payload = {
      id: result.user.id,
      username: result.user.username,
      role: result.user.role,
    };
    const token = jwt.sign(payload, secretKey, { expiresIn: "10m" });

    res.json({ success: true, token: token });
  } else {
    res.status(401).json({ success: false, message: result.message });
  }
});

// Check authentication
app.get("/check-auth", authenticateToken, async (req, res) => {
  res.json({
    loggedIn: true,
    id: req.user.id,
    username: req.user.username,
    role: req.user.role,
  });
});

// Register
app.post("/register", async (req, res) => {
  const { username, password, name, email, phone, dob } = req.body;
  const result = await registerUser(
    username,
    password,
    name,
    email,
    phone,
    dob
  );
  if (result.success) {
    res.status(201).json({ success: true, user: result.user });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
});

// Logout
app.post("/logout", authenticateToken, (req, res) => {
  res.status(200).json({ success: true, message: "Logged out" });
});

app.get("/users/export-users", authenticateToken, async (req, res) => {
  try {
    const users = await getAllUsersWithoutLimit();

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users found" });
    }

    const buffer = await exportUsersToExcel(users);

    res.setHeader("Content-Disposition", 'attachment; filename="users.xlsx"');
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  } catch (error) {
    console.error("Error exporting users to Excel:", error);
    res.status(500).json({ success: false, message: "Error exporting users" });
  }
});

app.delete(
  "/users/delete-checked-users",
  authenticateToken,
  async (req, res) => {
    const { userIds } = req.body;

    try {
      const result = await deleteInList(userIds);

      if (result.success) {
        if (result.deletedCount > 0) {
          res
            .status(201)
            .json({ success: true, message: "Users deleted successfully" });
        } else {
          res
            .status(400)
            .json({ success: false, message: "No users were deleted" });
        }
      } else {
        res.status(400).json({ success: false, message: result.message });
      }
    } catch (error) {
      console.error("Error deleting users:", error);
      res.status(500).json({ success: false, message: "Error deleting users" });
    }
  }
);

//Classes
app.get("/api/classes", authenticateToken, async (req, res) => {
  try {
    const classes = await getAllClasses();
    res.status(200).json(classes);
  } catch (error) {
    console.error("Error getting all classes:", error);
    res
      .status(500)
      .json({ success: false, message: "Error getting all classes" });
  }
});

app.get("/api/classes/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const classDetails = await getClassById(id);
    if (classDetails) {
      res.json({
        id: classDetails.id,
        name: classDetails.name,
        description: classDetails.description,
        creationDate: formatDateWithTime(classDetails.creationDate),
        startDate: formatDateWithTime(classDetails.startDate),
        endDate: formatDateWithTime(classDetails.endDate),
      });
    } else {
      res.status(404).json({ success: false, message: "Class not found" });
    }
  } catch (error) {
    console.error("Error getting class details:", error);
    res
      .status(500)
      .json({ success: false, message: "Error getting class details" });
  }
});

app.get("/api/classes/:id/students", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const students = await getAllUsersInClass(id);

    res.status(200).json(
      students.map((student) => ({
        username: student.username,
        name: student.name,
        email: student.email,
        phone: student.phone,
        dob: formatDate(student.date_of_birth),
      }))
    );
  } catch (error) {
    console.error("Error getting students:", error);
    res.status(500).json({ success: false, message: "Error getting students" });
  }
});

app.post("/api/classes/createClass", authenticateToken, async (req, res) => {
  const { className, description, creationDate, startDate, endDate } = req.body;

  try {
    const newClass = await addNewClass(
      className,
      description,
      creationDate,
      startDate,
      endDate
    );

    console.log("New class added:", newClass);
    res.status(201).json(newClass);
  } catch (error) {
    console.error("Error adding new class:", error);
    res.status(500).json({ success: false, message: "Error adding new class" });
  }
});

app.post(
  "/api/classes/:id/add-students",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of student IDs",
      });
    }

    try {
      await addUsersToClass(id, studentIds);
      res
        .status(201)
        .json({ success: true, message: "Students added successfully" });
    } catch (error) {
      console.error("Error adding students to class:", error);
      res
        .status(500)
        .json({ success: false, message: "Error adding students to class" });
    }
  }
);

app.get("/api/users/:classId", authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const users = await getAllUsersNotInClass(classId);
    res.status(200).json(users);
  } catch (error) {
    console.error("Error getting all users:", error);
    res
      .status(500)
      .json({ success: false, message: "Error getting all users" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
