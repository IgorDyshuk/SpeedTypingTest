import { showNotification } from "./notifications.js";


document.querySelectorAll(".input-container .toggle-password").forEach(toggle => {
  toggle.addEventListener("click", function () {
    const passwordField = this.previousElementSibling;

    const type = passwordField.getAttribute("type") === "password" ? "text" : "password";
    passwordField.setAttribute("type", type);

    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
  });
});


document.getElementById("sign-in-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.querySelector("#sign-in-form .email").value.trim();
  const password = document.querySelector("#sign-in-form .password").value.trim();

  try {
    const response = await fetch("http://127.0.0.1:8000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email: email,
        password: password,
      }),

    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail);
    }

    const data = await response.json();
    showNotification(data.message, "success");

    const container = document.querySelector(".login-container")
    container.classList.remove("open")

    const loginIcon = document.getElementById("login-icon")
    loginIcon.classList.remove("far")
    loginIcon.classList.add("fas")

    const username = document.querySelector(".profile .username")
    username.textContent = data.username;

    const profile_action = document.getElementById("log-text")
    profile_action.textContent = "Logout";

    document.querySelector(".nav-bar .profile .profile-actions").classList.add("active")

  } catch (error) {
    showNotification(error.message, "error");
  }
});

document.getElementById("sign-up-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const usernameInput = document.querySelector("#sign-up-form .username").value.trim();
  const emailInput = document.querySelector("#sign-up-form .email").value.trim();
  const passwordInput = document.querySelector("#sign-up-form .password").value.trim();

  try {
    const response = await fetch("http://127.0.0.1:8000/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        username: usernameInput,
        email: emailInput,
        password: passwordInput,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail);
    }

    const data = await response.json();
    showNotification(data.message, "success");

    const container = document.querySelector(".login-container");
    container.classList.remove("open");

    const loginIcon = document.getElementById("login-icon");
    loginIcon.classList.remove("far");
    loginIcon.classList.add("fas");

    const usernameDisplay = document.querySelector(".profile .username");
    usernameDisplay.textContent = data.username;

    document.querySelector(".nav-bar .profile .profile-actions").classList.add("active")

  } catch (error) {
    showNotification(error.message, "error");
  }
});


window.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("http://127.0.0.1:8000/profile", {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 204) {
      const container = document.querySelector(".login-container");
      const registerBtn = document.querySelector(".profile");

      registerBtn.addEventListener("click", () => {
        container.classList.add("open");
      })
      document.querySelector(".nav-bar .profile .profile-actions").classList.remove("active")
    } else if (response.ok) {
      const data = await response.json();

      const loginIcon = document.getElementById("login-icon")
      loginIcon.classList.remove("far")
      loginIcon.classList.add("fas")

      const username = document.querySelector(".profile .username")
      username.textContent = data.username;

      document.querySelector(".nav-bar .profile .profile-actions").classList.add("active")

    } else {
      throw new Error(response.statusText);
    }
  } catch (error) {
    console.log(error.message, "error");
  }
});

document.getElementById("logout").addEventListener("click", async () => {
  try {
    const response = await fetch("http://127.0.0.1:8000/logout", {
      method: "POST",
      credentials: "include",
    })

    if (response.ok) {
      const data = await response.json();

      const loginIcon = document.getElementById("login-icon")
      loginIcon.classList.remove("fas")
      loginIcon.classList.add("far")

      const username = document.querySelector(".profile .username")
      username.textContent = "";

      showNotification(data.message, "success");

      document.querySelector(".nav-bar .profile .profile-actions").classList.remove("active")

    } else {
      throw new Error(response.statusText);
    }
  } catch (error) {
    console.log(error.message, "error");
  }
})

document.querySelectorAll(".toggle-panel .fa-times").forEach(toggle => {
  toggle.addEventListener("click", function () {
    const container = document.querySelector(".login-container")
    container.classList.remove("open")
  })
})

document.getElementById("statistic").addEventListener("click", () => {
  window.location.href = "statistics.html"
})



