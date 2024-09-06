let currentActiveClassId = null;

$(document).ready(async function () {
  const userResponse = await $.ajax({
    url: "/check-auth",
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  $("#welcomeMessage").text(`Welcome, ${userResponse.username}`);

  adjustUIBasedOnUserRole(userResponse.role, userResponse.id);

  loadClasses();

  $(document).on("click", ".class-link", function (event) {
    event.preventDefault();

    const classId = $(this).data("id");
    currentActiveClassId = classId;

    $.ajax({
      url: `/api/classes/${classId}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      success: function (classDetails) {
        const $tableBody = $("#class-details tbody");
        $tableBody.empty();
        $tableBody.append(`
                '<tr>' +
                    '<td>${classDetails.id}</td>' +
                    '<td>${classDetails.name}</td>' +
                    '<td>${
                      classDetails.description ? classDetails.description : ""
                    }</td>' +
                    '<td>${classDetails.creationDate}</td>' +
                    '<td>${classDetails.startDate}</td>' +
                    '<td>${classDetails.endDate}</td>' +
                '</tr>'
            `);

        $("#class-details-title").show();
        $("#class-details").show();
        adjustUIBasedOnUserRole(userResponse.role, userResponse.id);

        //fetch students
        $("#addStudentsButton").toggle(userResponse.role === "admin");
        loadUsers(classId);
      },
      error: function (error) {
        console.log(error);
      },
    });
  });

  // Add class modal
  $("#addClassButton").click(() => {
    $("#createClassModal").show();
  });
  // end create user modal

  // create class form
  $("#createClassForm").submit(async function (event) {
    event.preventDefault();
    const className = $("#className").val();
    const description = $("#description").val();
    const startDate = $("#startDate").val();
    const endDate = $("#endDate").val();

    try {
      await $.ajax({
        url: "/api/classes/createClass",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        data: $.param({ className, description, startDate, endDate }),
      });

      alert("Class created successfully");

      loadClasses();

      $("#createClassForm").trigger("reset");

      closeCreateModal();
    } catch (error) {
      console.error("Error creating class", error);
    }
  });
  // end create user form

  // Add students modal
  $("#addStudentsButton").click(() => {
    $("#addStudentsModal").show();
    loadSelectUsers();
  });
  // end add students modal

  //add students
  $("#addStudentsForm").submit(function (event) {
    event.preventDefault();
    const studentIds = $("#studentSelect").val();

    $.ajax({
      url: `/api/classes/${currentActiveClassId}/add-students`,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      data: $.param({ studentIds }),
      success: function () {
        alert("Students added successfully");
        $("#addStudentsForm").trigger("reset");
        closeAddStudentsModal();
        loadUsers(currentActiveClassId);
      },
      error: function (error) {
        console.error("Error adding students", error);
      },
    });
  });

  //end add students

  //load users in the selection field
  function loadSelectUsers() {
    $.ajax({
      url: `/api/users/${currentActiveClassId || ""}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      success: function (users) {
        const $userSelect = $("#studentSelect");
        $userSelect.empty();
        users.forEach(function (user) {
          $userSelect.append(
            `<option value="${user.id}">${user.username}</option>`
          );
        });
      },
      error: function (error) {
        console.log(error);
      },
    });
  }
  //end load users

  //load users
  function loadUsers(classId) {
    $.ajax({
      url: `/api/classes/${classId}/students`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      success: function (students) {
        const $studentsTableBody = $("#students-details tbody");
        $studentsTableBody.empty();
        let counter = 1;
        students.forEach(function (student) {
          $studentsTableBody.append(`
                '<tr>'
                    '<td>${counter++}</td>'
                    '<td>${student.username}</td>'
                    '<td>${student.name}</td>'
                    '<td>${student.email}</td>'
                    '<td>${student.phone}</td>'
                    '<td>${student.dob}</td>'
                '</tr>'
            `);
        });

        $("#students-title").show();
        $("#students-details").show();
      },
      error: function (error) {
        console.log(error);
      },
    });
  }
  //end load users

  $("#logoutButton").click(() => {
    localStorage.removeItem("token");
    $("#classInfoContainer").hide();
    $("#studentsContainer").hide();
    window.location.href = "/";
  });

  initializeDatePicker("#startDate");
  initializeDatePicker("#endDate");
});

function loadClasses() {
  $.ajax({
    url: `/api/classes/${currentActiveClassId || ""}`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    success: function (classes) {
      const $classList = $("#classesList");
      $classList.empty();
      classes.forEach(function (classItem) {
        $classList.append(
          `<li><a href="#" class="class-link" data-id="${classItem.id}">${classItem.name}</a></li>`
        );
      });
    },
    error: function (error) {
      console.log(error);
    },
  });
}

//toggle theme
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
//end toggle theme

//Close modals
function closeCreateModal() {
  $("#createClassModal").hide();
}

function closeAddStudentsModal() {
  $("#addStudentsModal").hide();
}
//End close modals

//initialize date picker
function initializeDatePicker(selector) {
  flatpickr(selector, {
    dateFormat: "d/m/Y",
    enableTime: true,
    minDate: "01/01/1860", // based on max person ever lived
    maxDate: "today",
    onChange: function (selectedDates) {
      if (selectedDates.length > 0) {
        const date = selectedDates[0];
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
        const day = String(date.getDate()).padStart(2, "0");
        const hour = String(date.getHours()).padStart(2, "0");
        const minute = String(date.getMinutes()).padStart(2, "0");
        const formattedDate = `${day}/${month}/${year} ${hour}:${minute}`;
        $(selector).val(formattedDate);
      }
    },
  });
}
//end initialize date picker

function adjustUIBasedOnUserRole(userRole, userId) {
  const isAdmin = userRole === "admin";

  $("#addClassButton").toggle(isAdmin);
}
