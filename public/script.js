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

  //register
  $("#registerForm").submit(async function (event) {
    event.preventDefault();
    const username = $("#usernameRegister").val();
    const name = $("#nameRegister").val();
    const email = $("#emailRegister").val();
    const phone = $("#phoneRegister").val();
    const dob = $("#dobRegister").val();
    const password = $("#passwordRegister").val();
    const confirmPassword = $("#confirmPasswordRegister").val();

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
        url: "/register",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: $.param({ username, password, name, email, phone, dob }),
      });

      $("#registerForm").trigger("reset");

      closeRegisterModal();
      $("#verifyEmailModal").show();
      $("#verifyEmailUserId").value = response.user.id;
    } catch (error) {
      console.error("Error registering user", error);
    }
  });
  //end register

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
      localStorage.setItem("theme", "light");
      applyTheme();

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
  // $("#createUserButton").click(() => {
  //   $("#createUserModal").show();
  // });
  //end create user modal

  //create user form
  // $("#createUserForm").submit(async function (event) {
  //   event.preventDefault();
  //   const username = $("#username").val();
  //   const name = $("#name").val();
  //   const email = $("#email").val();
  //   const phone = $("#phone").val();
  //   const dob = $("#dob").val();
  //   const password = $("#password").val();
  //   const confirmPassword = $("#confirmPassword").val();

  //   const regex =
  //     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  //   if (!regex.test(password)) {
  //     alert(
  //       "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  //     );
  //     return;
  //   }

  //   if (password !== confirmPassword) {
  //     alert("Passwords do not match");
  //     return;
  //   }

  //   try {
  //     const response = await $.ajax({
  //       url: "/users/create",
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/x-www-form-urlencoded",
  //         Authorization: `Bearer ${localStorage.getItem("token")}`,
  //       },
  //       data: $.param({ username, password, name, email, phone, dob }),
  //     });

  //     $("#createUserForm").trigger("reset");

  //     closeCreateModal();
  //     $("#verifyEmailModal").show();
  //     $("#verifyEmailUserId").value = response.user.id;
  //   } catch (error) {
  //     console.error("Error creating user", error);
  //   }
  // });
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
        url: `/verify-email/`,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: $.param({ code }),
      });

      alert("Email verified successfully");
      $("#verifyEmailCode").val("");
      closeVerifyEmailModal();
      $("#loginModal").show();
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
  initializeDatePicker("#dateFrom");
  initializeDatePicker("#dateTo");
  initializeDatePicker("#dob");
  initializeDatePicker("#dobRegister");
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
              <td class="sticky-col"><a href="#" class="updateUserButton" 
                data-user-id="${user.id}"
                data-username="${user.username}"
                data-password="${user.password}"
                data-name="${user.name}"
                data-email="${user.email}"
                data-phone="${user.phone}"
                data-dob="${user.date_of_birth}">${user.id}</a>
              </td>
              <td class="sticky-col">${user.username}</td>
              <td>${user.name}</td>
              <td>${user.email}</td>
              <td>${user.phone}</td>
              <td>${user.date_of_birth}</td>
              <td>${user.role}</td>
              <td>${user.last_login ? user.last_login : ""}</td>
              <td>${user.created_at}</td>
              <td class="actions">
                <button onclick="deleteUser(${user.id})">Delete</button>
              </td>
              <td class="select"><input type="checkbox" id="active-${
                user.id
              }" ${user.active ? "checked" : ""}></td>
            </tr>`);
    });

    const $thead = $("#userTable thead");
    if (!$thead.find("tr.search-row").length) {
      const interaction = `
              <tr class="search-row">
                <td class="sticky-col"><input type="number" id="idSearchValue" class="search-input" /></td>
                <td class="sticky-col"><input type="text" id="usernameSearchValue" class="search-input" /></td>
                <td><input type="text" id="nameSearchValue" class="search-input" /></td>
                <td><input type="text" id="emailSearchValue" class="search-input" /></td>
                <td><input type="text" id="phoneSearchValue" class="search-input" /></td>
                <td><input type="text" id="dobSearchValue" class="search-input" />
                <input type="text" id="dobSearchValue2" class="search-input" style="display: none" /></td>
                <td></td>
                <td><input type="text" id="lastLoginSearchValue" class="search-input" />
                <input type="text" id="lastLoginSearchValue2" class="search-input" style="display: none" /></td>
                <td><input type="text" id="createdAtSearchValue" class="search-input" />
                <input type="text" id="createdAtSearchValue2" class="search-input" style="display: none" /></td>
                <td></td>
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
        "dobSearchValue2",
        "lastLoginSearchValue",
        "lastLoginSearchValue2",
        "createdAtSearchValue",
        "createdAtSearchValue2",
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
            const idPrefix = id.split("SearchOption")[0];
            const $primaryInput = $(`#${idPrefix}SearchValue`);
            const $secondaryInput = $(`#${idPrefix}SearchValue2`);
            if ($select.val() === "between") {
              $primaryInput.attr("placeholder", "Select 'Start date'");
              $secondaryInput.attr("placeholder", "Select 'End date'");
              $secondaryInput.show();
            } else {
              $primaryInput.attr("placeholder", "");
              $secondaryInput.attr("placeholder", "");
              $secondaryInput.hide();
            }
            loadUsers();
          });
        }
      });

      initializeDatePicker("#dobSearchValue");
      initializeDatePicker("#dobSearchValue2");
      initializeDatePicker("#lastLoginSearchValue");
      initializeDatePicker("#lastLoginSearchValue2");
      initializeDatePicker("#createdAtSearchValue");
      initializeDatePicker("#createdAtSearchValue2");
    }

    adjustUIBasedOnUserRole(user.role, user.id);

    $("#userListDiv").show();

    renderPagination(result.totalPages, page);
    applyTheme(localStorage.getItem("theme"));
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
  curUserId,
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

  if (curUserId === userId) {
    $("#updatePasswordLabel").show();
    $("#updatePassword").attr("type", "password");
  } else {
    $("#updatePasswordLabel").hide();
    $("#updatePassword").attr("type", "hidden");
  }

  $("#updateUserModal").show();
}
//end populate update form

//close modals
// function closeCreateModal() {
//   $("#createUserModal").hide();
// }

function closeUpdateModal() {
  $("#updateUserModal").hide();
}

function closeVerifyEmailModal() {
  $("#verifyEmailModal").hide();
}

function closeRegisterModal() {
  $("#registerModal").hide();
}
//end close modals

//UI
function adjustUIBasedOnUserRole(userRole, userId) {
  const isAdmin = userRole === "admin";

  $(
    "#exportToExcelButton, #userTable .actions, #userTable .select, #deleteSelectedUsersButton"
  ).toggle(isAdmin);

  if (isAdmin) {
    updateDeleteButtonVisibility();
  }

  $("#userTable .updateUserButton").each(function () {
    const id = $(this).data("user-id");
    const username = $(this).data("username");
    const password = $(this).data("password");
    const name = $(this).data("name");
    const email = $(this).data("email");
    const phone = $(this).data("phone");
    const dob = $(this).data("dob");

    const onclickValue = `populateUpdateForm(${userId}, ${id}, '${username}', '${password}', '${name}', '${email}', '${phone}', '${dob}')`;

    if (isAdmin || userId === id) {
      $(this).attr("onclick", onclickValue);
    } else {
      $(this).removeAttr("onclick");
    }
  });
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

  deleteBtn.prop("disabled", checkedBoxes.length === 0);
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
    {
      field: "dob",
      option: "dobSearchOption",
      value: "dobSearchValue",
      value2: "dobSearchValue2",
    },
    { field: "role", option: "roleSearchOption" },
    {
      field: "lastLogin",
      option: "lastLoginSearchOption",
      value: "lastLoginSearchValue",
      value2: "lastLoginSearchValue2",
    },
    {
      field: "createdAt",
      option: "createdAtSearchOption",
      value: "createdAtSearchValue",
      value2: "createdAtSearchValue2",
    },
  ];

  const params = searchOptions
    .map(({ field, option, value, value2 }) => {
      const searchOption = $(`#${option}`).val() || "";
      const searchValue = $(`#${value}`).val() || "";
      const searchValue2 = $(`#${value2}`).val() || "";

      if (
        field === "role" &&
        searchOption &&
        searchOption !== "chooseAnOption"
      ) {
        return `${field}=eq:${encodeURIComponent(searchOption)}`;
      } else if (
        field === "dob" ||
        field === "lastLogin" ||
        field === "createdAt"
      ) {
        if (searchOption === "between" && searchValue && searchValue2) {
          return `${field}=${encodeURIComponent(
            searchOption
          )}:${encodeURIComponent(searchValue)}_${encodeURIComponent(
            searchValue2
          )}`;
        } else if (searchValue) {
          return `${field}=${encodeURIComponent(
            searchOption
          )}:${encodeURIComponent(searchValue)}`;
        }
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

//Toggle theme function
function toggleTheme() {
  const $themeElements = $(
    "body, header, table, button, h1, h2, a, input, th, label, #welcomeMessage, .modal-content, .sticky-col"
  );
  var currentTheme = localStorage.getItem("theme") || "light";

  $themeElements.addClass(currentTheme + "-theme");

  var theme = $("body").hasClass("dark-theme") ? "light" : "dark";

  $themeElements
    .removeClass("light-theme dark-theme")
    .addClass(`${theme}-theme`);

  localStorage.setItem("theme", theme);
}
//end toggle theme function

//apply theme function
function applyTheme(theme) {
  const $themeElements = $(
    "body, header, table, button, h1, h2, a, input, th, label, #welcomeMessage, .modal-content, .sticky-col"
  );

  $themeElements
    .removeClass("light-theme dark-theme")
    .addClass(`${theme}-theme`);
}
//end apply theme function

//open register modal
$("#registerLink").click(function (event) {
  event.preventDefault();
  $("#loginModal").hide();
  $("#registerModal").show();
});
//end open register modal

//go back to login modal
$("#loginLink").click(function (event) {
  event.preventDefault();
  $("#registerModal").hide();
  $("#loginModal").show();
});
//end go back to login modal

//initialize date picker
function initializeDatePicker(selector) {
  flatpickr(selector, {
    dateFormat: "d/m/Y",
    enableTime: false,
    minDate: "01/01/1860", // based on max person ever lived
    maxDate: "today",
    onChange: function (selectedDates) {
      if (selectedDates.length > 0) {
        const date = selectedDates[0];
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
        const day = String(date.getDate()).padStart(2, "0");
        const formattedDate = `${day}/${month}/${year}`;
        $(selector).val(formattedDate);
      }
    },
  });
}
//end initialize date picker
