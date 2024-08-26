document.addEventListener("DOMContentLoaded", async function () {
  document.getElementById("loginModal").style.display = "block";
  document.getElementById("mainContent").style.display = "none";
  document.getElementById("logoutButton").style.display = "none";

  document
    .getElementById("loginForm")
    .addEventListener("submit", async function (event) {
      event.preventDefault();

      const username = document.getElementById("usernameLogin").value;
      const password = document.getElementById("passwordLogin").value;

      try {
        const response = await fetch("/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const result = await response.json();

        if (response.ok) {
          localStorage.setItem("token", result.token);

          const userResponse = await fetch("/check-auth", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${result.token}`,
            },
          });

          const userResult = await userResponse.json();

          adjustUIBasedOnUserRole(userResult.role, userResult.id);

          document.getElementById("loginForm").reset();
          document.getElementById("headerContent").style.display = "block";
          document.getElementById(
            "welcomeMessage"
          ).textContent = `Welcome, ${username}!`;
          document.getElementById("loginModal").style.display = "none";
          document.getElementById("mainContent").style.display = "block";
          document.getElementById("logoutButton").style.display =
            "inline-block";

          loadUsers();
        } else if (response.status === 401) {
          alert("Unauthorized");
        } else if (response.status === 403) {
          alert("You can't use this function!");
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error(error);
        alert("An error occured while logging in");
      }
    });

  document
    .getElementById("logoutButton")
    .addEventListener("click", async function () {
      try {
        const response = await fetch("/logout", {
          method: "POST",
        });

        if (response.ok) {
          localStorage.removeItem("token");

          document.getElementById("headerContent").style.display = "none";
          document.getElementById("welcomeMessage").textContent = "";
          document.getElementById("loginModal").style.display = "block";
          document.getElementById("mainContent").style.display = "none";
          document.getElementById("logoutButton").style.display = "none";
        } else if (response.status === 401) {
          alert("Unauthorized");
        } else if (response.status === 403) {
          alert("You can't use this function!");
        } else {
          alert("Error logging out");
        }
      } catch (error) {
        console.error(error);
        alert("An error occured while logging out");
      }
    });
});

document.addEventListener("DOMContentLoaded", () => {
  updateDeleteButtonVisibility();
  const createUserModal = document.getElementById("createUserModal");
  const createUserForm = document.getElementById("createUserForm");
  const updateUserForm = document.getElementById("updateUserForm");
  const verifyEmailModal = document.getElementById("verifyEmailModal");
  const verifyEmailForm = document.getElementById("verifyEmailForm");

  document.getElementById("createUserButton").addEventListener("click", () => {
    createUserModal.style.display = "block";
  });

  createUserForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const dob = document.getElementById("dob").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!regex.test(password)) {
      alert(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      );
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: new URLSearchParams({
          username,
          password,
          name,
          email,
          phone,
          dob,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        document.getElementById("username").value = "";
        document.getElementById("name").value = "";
        document.getElementById("email").value = "";
        document.getElementById("phone").value = "";
        document.getElementById("password").value = "";
        document.getElementById("confirmPassword").value = "";

        closeCreateModal();
        verifyEmailModal.style.display = "block";
        document.getElementById("verifyEmailUserId").value = result.user.id;
      } else if (response.status === 401) {
        alert("Unauthorized");
      } else if (response.status === 403) {
        alert("You can't use this function!");
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error creating user", error);
    }
  });

  updateUserForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const userId = document.getElementById("updateUserId").value;
    const name = document.getElementById("updateName").value;
    const username = document.getElementById("updateUsername").value;
    const email = document.getElementById("updateEmail").value;
    const password = document.getElementById("updatePassword").value;

    try {
      const response = await fetch(`/users/update/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: new URLSearchParams({ username, password, name, email }),
      });

      const result = await response.json();
      if (response.ok) {
        loadUsers();
        closeUpdateModal();
      } else if (response.status === 401) {
        alert("Unauthorized");
      } else if (response.status === 403) {
        alert("You can't use this function!");
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error updating user", error);
    }
  });

  verifyEmailForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const code = document.getElementById("verifyEmailCode").value;

    try {
      const response = await fetch(`/users/verify-email/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: new URLSearchParams({ code }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Email verified successfully");
        document.getElementById("verifyEmailCode").value = "";
        verifyEmailModal.style.display = "none";
        loadUsers();
      } else if (response.status === 401) {
        alert("Unauthorized");
      } else if (response.status === 403) {
        alert("You can't use this function!");
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error verifying email", error);
    }
  });
});

const userListDiv = document.getElementById("userList");

async function loadUsers(page = 1) {
  try {
    const token = localStorage.getItem("token");

    const userResponse = await fetch("/check-auth", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const searchInput = document.getElementById("searchValue")?.value || "";
    const dateFrom = document.getElementById("dateFrom").value;
    const dateTo = document.getElementById("dateTo").value;

    const idSearchValue = document.getElementById("idSearchValue")?.value || "";
    const usernameSearchValue =
      document.getElementById("usernameSearchValue")?.value || "";
    const nameSearchValue =
      document.getElementById("nameSearchValue")?.value || "";
    const emailSearchValue =
      document.getElementById("emailSearchValue")?.value || "";
    const dobSearchValue =
      document.getElementById("dobSearchValue")?.value || "";
    const phoneSearchValue =
      document.getElementById("phoneSearchValue")?.value || "";
    const lastLoginSearchValue =
      document.getElementById("lastLoginSearchValue")?.value || "";
    const createdAtSearchValue =
      document.getElementById("createdAtSearchValue")?.value || "";

    const idSearchOption =
      document.getElementById("idSearchOption")?.value || "";
    const usernameSearchOption =
      document.getElementById("usernameSearchOption")?.value || "";
    const nameSearchOption =
      document.getElementById("nameSearchOption")?.value || "";
    const emailSearchOption =
      document.getElementById("emailSearchOption")?.value || "";
    const dobSearchOption =
      document.getElementById("dobSearchOption")?.value || "";
    const phoneSearchOption =
      document.getElementById("phoneSearchOption")?.value || "";
    const roleSearchOption =
      document.getElementById("roleSearchOption")?.value || "";
    const lastLoginSearchOption =
      document.getElementById("lastLoginSearchOption")?.value || "";
    const createdAtSearchOption =
      document.getElementById("createdAtSearchOption")?.value || "";

    console.log(roleSearchOption);

    const url =
      searchInput || dateFrom || dateTo
        ? `/users?page=${page}&value=${encodeURIComponent(
            searchInput
          )}&dateFrom=${encodeURIComponent(
            dateFrom
          )}&dateTo=${encodeURIComponent(dateTo)}`
        : `/users?page=${page}&id=${encodeURIComponent(
            `${idSearchOption}:${idSearchValue}`
          )}&username=${encodeURIComponent(
            `${usernameSearchOption}:${usernameSearchValue}`
          )}&name=${encodeURIComponent(
            `${nameSearchOption}:${nameSearchValue}`
          )}&email=${encodeURIComponent(
            `${emailSearchOption}:${emailSearchValue}`
          )}&phone=${encodeURIComponent(
            `${phoneSearchOption}:${phoneSearchValue}`
          )}&dob=${encodeURIComponent(
            `${dobSearchOption}:${dobSearchValue}`
          )}&role=${encodeURIComponent(
            `${roleSearchOption}`
          )}&lastLogin=${encodeURIComponent(
            `${lastLoginSearchOption}:${lastLoginSearchValue}`
          )}&createdAt=${encodeURIComponent(
            `${createdAtSearchOption}:${createdAtSearchValue}`
          )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    const users = result.users || [];

    const user = await userResponse.json();

    const tableBody = document.querySelector("#userTable tBody");
    tableBody.innerHTML = users
      .map(
        (user) => `
            <tr id="user-${user.id}">
              <td><a href="#" class="updateUserButton" data-user-id="${user.id}"
                                                       data-username="${
                                                         user.username
                                                       }"
                                                       data-password="${
                                                         user.password
                                                       }"
                                                       data-name="${user.name}"
                                                       data-email="${
                                                         user.email
                                                       }"
                                                       data-phone="${
                                                         user.phone
                                                       }">${user.id}</a></td>
              <td>${user.username}</td>
              <td>${user.name}</td>
              <td>${user.email}</td>
              <td>${user.phone}</td>
              <td>${user.date_of_birth}</td>
              <td>${user.role}</td>
              <td>${user.last_login ? user.last_login : ""}</td>
              <td>${user.created_at}</td>
              <td class="actions">
                <button onclick="deleteUser(${user.id})">Delete</button>
                <input type="checkbox" id="active-${user.id}" ${
          user.active ? "checked" : ""
        }>
              </td>
            </tr>`
      )
      .join("");

    const thead = document.querySelector("#userTable thead");
    if (!thead.querySelector("tr.search-row")) {
      const interaction = `<tr class="search-row">
                <td>
                  <select id="idSearchOption" class="search-select">
                    <option value="chooseAnOption">Choose an option</option>
                    <option value="greaterOrEquals">Greater than or equal</option>
                    <option value="lessOrEquals">Less than or equal</option>
                  </select>
                </td>
                <td>
                  <select id="usernameSearchOption" class="search-select">
                    <option value="chooseAnOption">Choose an option</option>
                    <option value="startsWith">Starts with</option>
                    <option value="endsWith">Ends with</option>
                    <option value="contains">Contains</option>
                  </select>
                </td>
                <td>
                  <select id="nameSearchOption" class="search-select">
                    <option value="chooseAnOption">Choose an option</option>
                    <option value="startsWith">Starts with</option>
                    <option value="endsWith">Ends with</option>
                    <option value="contains">Contains</option>
                  </select>
                </td>
                <td>
                  <select id="emailSearchOption" class="search-select">
                    <option value="chooseAnOption">Choose an option</option>
                    <option value="startsWith">Starts with</option>
                    <option value="endsWith">Ends with</option>
                    <option value="contains">Contains</option>
                  </select>
                </td>
                <td>
                  <select id="phoneSearchOption" class="search-select">
                    <option value="chooseAnOption">Choose an option</option>
                    <option value="startsWith">Starts with</option>
                    <option value="endsWith">Ends with</option>
                    <option value="contains">Contains</option>
                  </select>
                </td>
                <td>
                  <select id="dobSearchOption" class="search-select">
                    <option value="chooseAnOption">Choose an option</option>
                    <option value="startsFrom">Starts from</option>
                    <option value="endsTo">Ends to</option>
                  </select>
                </td>
                <td>
                  <select id="roleSearchOption" class="search-select">
                    <option value="chooseAnOption">Choose an option</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <select id="lastLoginSearchOption" class="search-select">
                    <option value="chooseAnOption">Choose an option</option>
                    <option value="startsFrom">Starts from</option>
                    <option value="endsTo">Ends to</option>
                  </select>
                </td>
                <td>
                  <select id="createdAtSearchOption" class="search-select">
                    <option value="chooseAnOption">Choose an option</option>
                    <option value="startsFrom">Starts from</option>
                    <option value="endsTo">Ends to</option>
                  </select>
                </td>
                <td></td>
              </tr>
              <tr>
                <td><input type="text" id="idSearchValue" class="search-input" /></td>
                <td><input type="text" id="usernameSearchValue" class="search-input" /></td>
                <td><input type="text" id="nameSearchValue" class="search-input" /></td>
                <td><input type="text" id="emailSearchValue" class="search-input" /></td>
                <td><input type="text" id="phoneSearchValue" class="search-input" /></td>
                <td><input type="text" id="dobSearchValue" class="search-input" /></td>
                <td></td>
                <td><input type="text" id="lastLoginSearchValue" class="search-input" /></td>
                <td><input type="text" id="createdAtSearchValue" class="search-input" /></td>
                <td></td>
              </tr>`;

      thead.insertAdjacentHTML("beforeend", interaction);

      const searchInputs = [
        "idSearchValue",
        "usernameSearchValue",
        "nameSearchValue",
        "emailSearchValue",
        "phoneSearchValue",
        "dobSearchValue",
        "lastLoginSearchValue",
        "createdAtSearchValue",
      ];

      const searchOptions = [
        "idSearchOption",
        "usernameSearchOption",
        "nameSearchOption",
        "emailSearchOption",
        "phoneSearchOption",
        "dobSearchOption",
        "roleSearchOption",
        "lastLoginSearchOption",
        "createdAtSearchOption",
      ];

      searchInputs.forEach((id) => {
        const input = document.getElementById(id);
        if (input) {
          input.addEventListener("input", function () {
            collectSearchParams();
            loadUsers();
          });
        }
      });

      searchOptions.forEach((id) => {
        const select = document.getElementById(id);
        if (select) {
          select.addEventListener("change", function () {
            collectSearchParams();
            loadUsers();
          });
        }
      });

      flatpickr("#dobSearchValue", {
        dateFormat: "d/m/Y",
        minDate: "01/01/1860", //based on max person ever lived,
        maxDate: "today",
        onChange: function (selectedDates) {
          if (selectedDates.length > 0) {
            const dob = selectedDates[1];
            document.getElementById("dobSearchValue").value = dob
              .toISOString()
              .split("T")[0];
          }
        },
      });

      flatpickr("#lastLoginSearchValue", {
        dateFormat: "d/m/Y",
        minDate: "01/01/1860", //based on max person ever lived,
        maxDate: "today",
        onChange: function (selectedDates) {
          if (selectedDates.length > 0) {
            const dob = selectedDates[1];
            document.getElementById("lastLoginSearchValue").value = dob
              .toISOString()
              .split("T")[0];
          }
        },
      });

      flatpickr("#createdAtSearchValue", {
        dateFormat: "d/m/Y",
        minDate: "01/01/1860", //based on max person ever lived,
        maxDate: "today",
        onChange: function (selectedDates) {
          if (selectedDates.length > 0) {
            const dob = selectedDates[1];
            document.getElementById("createdAtSearchValue").value = dob
              .toISOString()
              .split("T")[0];
          }
        },
      });
    }

    adjustUIBasedOnUserRole(user.role, user.id);

    userListDiv.style.display = "block";

    renderPagination(result.totalPages, page);
  } catch (error) {
    console.error("Error loading users", error);
  }
}

document.getElementById("searchValue").addEventListener("input", loadUsers);
document.getElementById("dateFrom").addEventListener("input", loadUsers);
document.getElementById("dateTo").addEventListener("input", loadUsers);

async function deleteUser(id) {
  try {
    const response = await fetch(`/users/delete/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      document.getElementById(`user-${id}`).remove();
      alert("User has been deleted");
    } else if (response.status === 401) {
      alert("Unauthorized");
    } else if (response.status === 403) {
      alert("You can't use this function!");
    } else {
      const result = await response.json();
      alert(result.message || "Error deleting user");
    }
  } catch (error) {
    console.error("Error deleting user", error);
  }
}

function populateUpdateForm(userId, username, password, name, email) {
  document.getElementById("updateUserId").value = userId;
  document.getElementById("updateUsername").value = username;
  document.getElementById("updateName").value = name;
  document.getElementById("updateEmail").value = email;
  document.getElementById("updatePassword").value = password;
  updateUserModal.style.display = "block";
}

function closeCreateModal() {
  document.getElementById("createUserModal").style.display = "none";
}

function closeUpdateModal() {
  document.getElementById("updateUserModal").style.display = "none";
}

function closeVerifyEmailModal() {
  document.getElementById("verifyEmailModal").style.display = "none";
}

async function adjustUIBasedOnUserRole(userRole, userId) {
  if (userRole === "admin") {
    document.getElementById("createUserButton").style.display = "block";
    document.getElementById("exportToExcelButton").style.display = "block";
    document.querySelectorAll("#userTable .actions").forEach((element) => {
      element.style.display = "table-cell";
    });

    updateDeleteButtonVisibility();

    document
      .querySelectorAll("#userTable .updateUserButton")
      .forEach((element) => {
        const userId = element.getAttribute("data-user-id");
        const username = element.getAttribute("data-username");
        const password = element.getAttribute("data-password");
        const name = element.getAttribute("data-name");
        const email = element.getAttribute("data-email");

        element.setAttribute(
          "onclick",
          `populateUpdateForm(${userId}, '${username}', '${password}', '${name}', '${email}')`
        );
      });
  } else {
    document.getElementById("createUserButton").style.display = "none";
    document.getElementById("exportToExcelButton").style.display = "none";
    document.querySelectorAll("#userTable .actions").forEach((element) => {
      element.style.display = "none";
    });
    document.getElementById("deleteSelectedUsersButton").style.display = "none";

    document
      .querySelectorAll("#userTable .updateUserButton")
      .forEach((element) => {
        const id = element.getAttribute("data-user-id");
        const username = element.getAttribute("data-username");
        const password = element.getAttribute("data-password");
        const name = element.getAttribute("data-name");
        const email = element.getAttribute("data-email");

        if (userId != id) {
          element.removeAttribute("onclick");
        } else if (userId == id && !element.hasAttribute("onclick")) {
          element.setAttribute(
            "onclick",
            `populateUpdateForm(${id} , '${username}', '${password}', '${name}', '${email}')`
          );
        }
      });
  }
}

document
  .getElementById("exportToExcelButton")
  .addEventListener("click", async () => {
    try {
      const response = await fetch("/users/export-users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "users.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Error exporting users to Excel");
      }
    } catch (error) {
      console.error("Error exporting users", error);
      alert("Error exporting users to Excel");
    }
  });

function renderPagination(totalPages, currentPage) {
  const pagination = document.getElementById("pagination");

  pagination.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.textContent = i;
    pageBtn.classList.add("pagination-btn");

    if (i === currentPage) {
      pageBtn.classList.add("active");
    }
    pageBtn.addEventListener("click", () => loadUsers(i));
    pagination.appendChild(pageBtn);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  flatpickr("#dateFrom", {
    dateFormat: "d/m/Y",
    enableTime: false,
    minDate: "01/01/1860", //based on max person ever lived
    maxDate: "today",
    onChange: function (selectedDates) {
      if (selectedDates.length > 0) {
        const startDate = selectedDates[1];
        document.getElementById("dateFrom").value = startDate
          .toISOString()
          .split("T")[0];
      }
    },
  });

  flatpickr("#dateTo", {
    dateFormat: "d/m/Y",
    enableTime: false,
    minDate: "01/01/1860", //based on max person ever lived,
    maxDate: "today",
    onChange: function (selectedDates) {
      if (selectedDates.length > 0) {
        const endDate = selectedDates[1];
        document.getElementById("dateTo").value = endDate
          .toISOString()
          .split("T")[0];
      }
    },
  });

  flatpickr("#dob", {
    dateFormat: "d/m/Y",
    minDate: "01/01/1860", //based on max person ever lived,
    maxDate: "today",
    onChange: function (selectedDates) {
      if (selectedDates.length > 0) {
        const dob = selectedDates[1];
        document.getElementById("dob").value = dob.toISOString().split("T")[0];
      }
    },
  });
});

document
  .getElementById("deleteSelectedUsersButton")
  .addEventListener("click", async () => {
    const checkedBoxes = document.querySelectorAll(
      'input[type="checkbox"]:checked'
    );
    const userIds = Array.from(checkedBoxes).map(
      (checkbox) => checkbox.id.split("-")[1]
    );

    if (userIds.length === 0) {
      alert("Please select at least one user");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/users/delete-checked-users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds }),
      });

      if (response.ok) {
        userIds.forEach((userId) => {
          const row = document.getElementById(`user-${userId}`);
          if (row) {
            row.remove();
          }
        });

        alert("Users deleted successfully");
      } else {
        alert("Something happened when deleting users");
      }
    } catch (error) {
      console.error("Error deleting users", error);
      alert("Error deleting users");
    }
  });

function updateDeleteButtonVisibility() {
  const checkedBoxes = document.querySelectorAll(
    'input[type="checkbox"]:checked'
  );

  const deleteBtn = document.getElementById("deleteSelectedUsersButton");

  deleteBtn.style.display = checkedBoxes.length > 0 ? "block" : "none";
}

document.querySelector("#userTable").addEventListener("change", (event) => {
  if (event.target.type === "checkbox") {
    updateDeleteButtonVisibility();
  }
});

function collectSearchParams() {
  const searchOptions = [
    { field: "id", option: "idSearchOption", value: "idSearchValue" },
    {
      field: "username",
      option: "usernameSearchOption",
      value: "usernameSearchValue",
    },
    { field: "name", option: "nameSearchOption", value: "nameSearchValue" },
    { field: "email", option: "emailSearchOption", value: "emailSearchValue" },
    { field: "phone", option: "phoneSearchOption", value: "phoneSearchValue" },
    { field: "dob", option: "dobSearchOption", value: "dobSearchValue" },
    { field: "role", option: "roleSearchOption", value: "roleSearchOption" },
    {
      field: "lastLogin",
      option: "lastLoginSearchOption",
      value: "lastLoginSearchValue",
    },
    {
      field: "createdAt",
      option: "createdAtSearchOption",
      value: "createdAtSearchValue",
    },
  ];

  const params = searchOptions
    .map(({ field, option, value }) => {
      const searchOption = document.getElementById(option).value;
      const searchValue = document.getElementById(value).value;

      if (searchOption && searchOption !== "chooseAnOption" && searchValue) {
        return `${field}=${encodeURIComponent(
          searchOption
        )}:${encodeURIComponent(searchValue)}`;
      }

      return null;
    })
    .filter((param) => param !== null)
    .join("&");

  return params ? params : null;
}
