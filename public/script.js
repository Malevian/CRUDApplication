$(document).ready(async function () {
  //start window
  $("#loginModal").show();
  $("#mainContent").hide();
  $("#logoutButton").hide();
  //end start window

  //login
  $("#loginForm").submit(async function (event) {
    event.preventDefault();

    const username = $("#usernameLogin").val();
    const password = $("#passwordLogin").val();

    try {
      const response = await $.ajax({
        url: "/login",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({ username, password }),
      });

      localStorage.setItem("token", response.token);

      const userResponse = await $.ajax({
        url: "/check-auth",
        method: "GET",
        headers: {
          Authorization: `Bearer ${response.token}`,
        },
      });

      adjustUIBasedOnUserRole(userResponse.role, userResponse.id);

      $("#loginForm").trigger("reset");
      $("#headerContent").show();
      $("#welcomeMessage").text(`Welcome, ${username}`);
      $("#loginModal").hide();
      $("#mainContent").show();
      $("#logoutButton").show();

      loadUsers();
    } catch (error) {
      console.error(error);
      alert("An error occured while logging in");
    }
  });
  //end login

  //logout
  $("#logoutButton").click(async function () {
    try {
      const response = await $.ajax({
        url: "/logout",
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      localStorage.removeItem("token");

      $("#headerContent").hide();
      $("#welcomeMessage").text("");
      $("#loginModal").show();
      $("#mainContent").hide();
      $("#logoutButton").hide();
    } catch (error) {
      console.error(error);
      alert("An error occured while logging out");
    }
  });
  //end logout

  updateDeleteButtonVisibility();

  //create user modal
  $("#createUserButton").click(() => {
    $("#createUserModal").show();
  });
  //end create user modal

  //create user form
  $("#createUserForm").submit(async function (event) {
    event.preventDefault();
    const username = $("#username").val();
    const name = $("#name").val();
    const email = $("#email").val();
    const phone = $("#phone").val();
    const dob = $("#dob").val();
    const password = $("#password").val();
    const confirmPassword = $("#confirmPassword").val();

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
      const response = await $.ajax({
        url: "/users/create",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        data: $.param({ username, password, name, email, phone, dob }),
      });

      $("#createUserForm").trigger("reset");

      closeCreateModal();
      $("#verifyEmailModal").show();
      $("#verifyEmailUserId").value = response.user.id;
    } catch (error) {
      console.error("Error creating user", error);
    }
  });
  //end create user form

  //update user form
  $("#updateUserForm").submit(async function (event) {
    event.preventDefault();

    const userId = $("#updateUserId").val();
    const name = $("#updateName").val();
    const username = $("#updateUsername").val();
    const email = $("#updateEmail").val();
    const phone = $("#updatePhone").val();
    const dob = $("#updateDob").val();
    const password = $("#updatePassword").val();

    try {
      await $.ajax({
        url: `/users/update/${userId}`,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        data: $.param({ username, password, name, email, phone, dob }),
      });

      loadUsers();
      closeUpdateModal();
    } catch (error) {
      alert(error.responseJSON.message);
      console.error("Error updating user", error);
    }
  });
  //end update user form

  //verify email form
  $("#verifyEmailForm").submit(async function (event) {
    event.preventDefault();
    const code = $("#verifyEmailCode").val();

    try {
      await $.ajax({
        url: `/users/verify-email/`,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        data: $.param({ code }),
      });

      alert("Email verified successfully");
      $("#verifyEmailCode").val("");
      closeVerifyEmailModal();
      loadUsers();
    } catch (error) {
      console.error("Error verifying email", error);
    }
  });
  //end verify email form

  //export to excel
  $("#exportToExcelButton").click(async function () {
    try {
      const response = await $.ajax({
        url: "/users/export-users",
        method: "GET",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        xhrFields: { responseType: "blob" },
      });

      const url = window.URL.createObjectURL(response);
      const a = $("<a>")
        .attr("href", url)
        .attr("download", "users.xlsx")
        .appendTo("body");
      a[0].click();
      a.remove();
    } catch (error) {
      console.error("Error exporting users", error);
      alert("Error exporting users to Excel");
    }
  });
  //end export to excel

  //delete selected users
  $("#deleteSelectedUsersButton").click(async function () {
    try {
      const selectedIds = $('input[type="checkbox"]:checked')
        .map(function () {
          return this.id.split("-")[1];
        })
        .get();

      if (selectedIds.length > 0) {
        await $.ajax({
          url: "/users/delete-checked-users",
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          data: JSON.stringify({ userIds: selectedIds }),
        });

        selectedIds.forEach((id) => $(`#user-${id}`).remove());
        alert("Users deleted successfully");
      } else {
        alert("Please select at least one user");
      }
    } catch (error) {
      alert(error.responseJSON.message);
    }
  });
  //end delete selected users

  //date pickers
  flatpickr("#dateFrom", {
    dateFormat: "d/m/Y",
    enableTime: false,
    minDate: "01/01/1860", //based on max person ever lived
    maxDate: "today",
    onChange: function (selectedDates) {
      if (selectedDates.length > 0) {
        const startDate = selectedDates[0];
        $("#dateFrom").val(startDate.toISOString().split("T")[0]);
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
        const endDate = selectedDates[0];
        $("#dateTo").val(endDate.toISOString().split("T")[0]);
      }
    },
  });

  flatpickr("#dob", {
    dateFormat: "d/m/Y",
    minDate: "01/01/1860", //based on max person ever lived,
    maxDate: "today",
    onChange: function (selectedDates) {
      if (selectedDates.length > 0) {
        const dob = selectedDates[0];
        $("#dob").val(dob.toISOString().split("T")[0]);
      }
    },
  });
  //end date pickers
});

//load users
async function loadUsers(page = 1) {
  try {
    const token = localStorage.getItem("token");

    const userResponse = await fetch("/check-auth", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const searchParams = collectSearchParams();

    let url = `/users?page=${page}`;

    if (searchParams) {
      url += `&${searchParams}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    const users = result.users || [];

    const user = await userResponse.json();

    const $tableBody = $("#userTable tbody");
    $tableBody.empty();
    users.forEach((user) => {
      $tableBody.append(`
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
                                                       }"
                                                       data-dob="${
                                                         user.date_of_birth
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
            </tr>`);
    });

    const $thead = $("#userTable thead");
    if (!$thead.find("tr.search-row").length) {
      const interaction = `
              <tr class="search-row">
                <td><input type="number" id="idSearchValue" class="search-input" /></td>
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

      $thead.append(interaction);

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
        const $input = $(`#${id}`);
        if ($input.length) {
          $input.on("input", function () {
            loadUsers();
          });
        }
      });

      searchOptions.forEach((id) => {
        const $select = $(`#${id}`);
        if ($select.length) {
          $select.on("change", function () {
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
            const dob = selectedDates[0];
            $("#dobSearchValue").val(dob.toISOString().split("T")[0]);
          }
        },
      });

      flatpickr("#lastLoginSearchValue", {
        dateFormat: "d/m/Y",
        minDate: "01/01/1860", //based on max person ever lived,
        maxDate: "today",
        onChange: function (selectedDates) {
          if (selectedDates.length > 0) {
            const dob = selectedDates[0];
            $("#lastLoginSearchValue").val(dob.toISOString().split("T")[0]);
          }
        },
      });

      flatpickr("#createdAtSearchValue", {
        dateFormat: "d/m/Y",
        minDate: "01/01/1860", //based on max person ever lived,
        maxDate: "today",
        onChange: function (selectedDates) {
          if (selectedDates.length > 0) {
            const dob = selectedDates[0];
            $("#createdAtSearchValue").val(dob.toISOString().split("T")[0]);
          }
        },
      });
    }

    adjustUIBasedOnUserRole(user.role, user.id);

    $("#userListDiv").show();

    renderPagination(result.totalPages, page);
  } catch (error) {
    console.error("Error loading users", error);
  }
}
//end load users

$("#searchValue").on("input", loadUsers);
$("#dateFrom").on("input", loadUsers);
$("#dateTo").on("input", loadUsers);

//delete user
async function deleteUser(id) {
  try {
    await $.ajax({
      url: `/users/delete/${id}`,
      type: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    $(`#user-${id}`).remove();
    alert("User has been deleted");
  } catch (error) {
    alert(error.responseJSON.message || "Error deleting user");
  }
}
//end delete user

//populate update form
function populateUpdateForm(
  userId,
  username,
  password,
  name,
  email,
  phone,
  dob
) {
  $("#updateUserId").val(userId);
  $("#updateUsername").val(username);
  $("#updateName").val(name);
  $("#updateEmail").val(email);
  $("#updatePhone").val(phone);
  $("#updateDob").val(dob);
  $("#updatePassword").val(password);
  $("#updateUserModal").show();
}
//end populate update form

//close modals
function closeCreateModal() {
  $("#createUserModal").hide();
}

function closeUpdateModal() {
  $("#updateUserModal").hide();
}

function closeVerifyEmailModal() {
  $("#verifyEmailModal").hide();
}
//end close modals

//UI
function adjustUIBasedOnUserRole(userRole, userId) {
  if (userRole === "admin") {
    $("#createUserButton").show();
    $("#exportToExcelButton").show();
    $("#userTable .actions").show();

    updateDeleteButtonVisibility();

    $("#userTable .updateUserButton").each(function () {
      const userId = $(this).data("user-id");
      const username = $(this).data("username");
      const password = $(this).data("password");
      const name = $(this).data("name");
      const email = $(this).data("email");
      const phone = $(this).data("phone");
      const dob = $(this).data("dob");

      $(this).attr(
        "onclick",
        `populateUpdateForm(${userId}, '${username}', '${password}', '${name}', '${email}', '${phone}', '${dob}')`
      );
    });
  } else {
    $("#createUserButton").hide();
    $("#exportToExcelButton").hide();
    $("#userTable .actions").hide();

    $("#userTable .updateUserButton").each(function () {
      const id = $(this).data("user-id");
      const username = $(this).data("username");
      const password = $(this).data("password");
      const name = $(this).data("name");
      const email = $(this).data("email");
      const phone = $(this).data("phone");
      const dob = $(this).data("dob");

      if (userId !== id) {
        $(this).removeAttr("onclick");
      } else if (userId === id && !$(this).attr("onclick")) {
        $(this).attr(
          "onclick",
          `populateUpdateForm(${id}, '${username}', '${password}', '${name}', '${email}', '${phone}', '${dob}')`
        );
      }
    });
    $("#createUserButton").hide();
    $("#exportToExcelButton").hide();
    $("#userTable .actions").hide();
    $("#deleteSelectedUsersButton").hide();
  }
}
//end UI

//pagination
function renderPagination(totalPages, currentPage) {
  const $pagination = $("#pagination");
  $pagination.empty();

  for (let i = 1; i <= totalPages; i++) {
    const $pageBtn = $("<button>")
      .text(i)
      .addClass("pagination-btn")
      .toggleClass("active", i === currentPage)
      .click(() => loadUsers(i));

    $pagination.append($pageBtn);
  }
}
//end pagination

//update delete multiple users button
function updateDeleteButtonVisibility() {
  const checkedBoxes = $("input[type='checkbox']:checked");
  const deleteBtn = $("#deleteSelectedUsersButton");

  deleteBtn.css("display", checkedBoxes.length > 0 ? "block" : "none");
}

$("#userTable").on("change", "input[type='checkbox']", function () {
  updateDeleteButtonVisibility();
});
//end update delete multiple users button

//collect parameters from fields
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
    { field: "role", option: "roleSearchOption" },
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
      const searchOption = $(`#${option}`).val() || "";
      const searchValue = $(`#${value}`).val() || "";

      if (
        field === "role" &&
        searchOption &&
        searchOption !== "chooseAnOption"
      ) {
        return `${field}=${encodeURIComponent(searchOption)}`;
      } else if (
        searchOption &&
        searchOption !== "chooseAnOption" &&
        searchValue
      ) {
        return `${field}=${encodeURIComponent(
          searchOption
        )}:${encodeURIComponent(searchValue)}`;
      }

      return null;
    })
    .filter((param) => param !== null)
    .join("&");

  const searchInput = $("#searchValue").val() || "";
  const dateFrom = $("#dateFrom").val() || "";
  const dateTo = $("#dateTo").val() || "";

  const additionalParams = [
    searchInput && `value=${encodeURIComponent(searchInput)}`,
    dateFrom && `dateFrom=${encodeURIComponent(dateFrom)}`,
    dateTo && `dateTo=${encodeURIComponent(dateTo)}`,
  ]
    .filter((param) => param)
    .join("&");

  const finalParams = additionalParams
    ? `${params}&${additionalParams}`
    : params;

  return finalParams ? finalParams : null;
}
//end collect parameters from fields
