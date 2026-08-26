
// GET ELEMENTS

const passwordInput = document.getElementById("password");

const togglePassword = document.getElementById("togglePassword");

const loginForm = document.getElementById("loginForm");

const usernameInput = document.getElementById("username");


// SHOW / HIDE PASSWORD

togglePassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.classList.remove("fa-eye");

        togglePassword.classList.add("fa-eye-slash");

    } else {

        passwordInput.type = "password";

        togglePassword.classList.remove("fa-eye-slash");

        togglePassword.classList.add("fa-eye");

    }

});

// LOGIN FORM


loginForm.addEventListener("submit", function (event) {

    // Prevent page refresh
    event.preventDefault();


    const username = usernameInput.value.trim();

    const password = passwordInput.value.trim();


    // Check empty input

    if (username === "") {

        alert("Please enter your username.");

        usernameInput.focus();

        return;
    }


    if (password === "") {

        alert("Please enter your password.");

        passwordInput.focus();

        return;
    }


    // Login success message

    alert("Login successful!");


    // Later you can connect this
    // with a backend/API.

});