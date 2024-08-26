const XLSX = require("xlsx");
const { formatDateWithTime } = require("../utilities/dateUtils");

async function exportUsersToExcel(users) {
  const usersData = users.map((user) => ({
    ID: user.id,
    Username: user.username,
    Name: user.name,
    Email: user.email,
    Phone: user.phone,
    "Date of birth": formatDateWithTime(user.date_of_birth),
    Role: user.role,
    "Created at": formatDateWithTime(user.created_at),
    "Last login": formatDateWithTime(user.last_login),
  }));

  const workBook = XLSX.utils.book_new();
  const workSheet = XLSX.utils.json_to_sheet(usersData);

  XLSX.utils.book_append_sheet(workBook, workSheet, "Users");

  const buffer = XLSX.write(workBook, { bookType: "xlsx", type: "buffer" });

  return buffer;
}

module.exports = { exportUsersToExcel };
