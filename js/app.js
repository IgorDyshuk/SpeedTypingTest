import {showNotification} from "./notifications.js";
import {origin} from "./origin.js"

const container = document.getElementById("container");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");

registerBtn.addEventListener("click", () => {
  container.classList.add("active");
})

loginBtn.addEventListener("click", () => {
  container.classList.remove("active");
})

document.querySelectorAll(".input-container .toggle-password").forEach(toggle => {
  toggle.addEventListener("click", function () {
    const passwordField = this.previousElementSibling;

    const type = passwordField.getAttribute("type") === "password" ? "text" : "password";
    passwordField.setAttribute("type", type);

    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
  });
});

document.getElementById("login-form").addEventListener("click", () => {
  const container = document.querySelector(".login-container");
  container.classList.add("open");
});

document.querySelector(".login-container").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) {
    const container = document.querySelector(".login-container");
    container.classList.remove("open");
  }
});

document.getElementById("sign-in-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.querySelector("#sign-in-form .email").value.trim();
  const password = document.querySelector("#sign-in-form .password").value.trim();

  try {
    const response = await fetch(`https://crappie-warm-squirrel.ngrok-free.app/login`, {
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
    const response = await fetch(`https://crappie-warm-squirrel.ngrok-free.app/register`, {
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
  const transition = document.getElementById("page-transition");

  try {
    const response = await fetch("https://crappie-warm-squirrel.ngrok-free.app/profile", {
      method: "GET",
      credentials: "include", // ОБЯЗАТЕЛЬНО, чтобы куки отправлялись
    });

    transition.classList.add("active");

    if (response.status === 204) {
      document.querySelector(".nav-bar .profile .profile-actions").classList.remove("active");
    } else if (response.ok) {
      const data = await response.json();

      const loginIcon = document.getElementById("login-icon");
      loginIcon.classList.remove("far");
      loginIcon.classList.add("fas");

      const username = document.querySelector(".profile .username");
      username.textContent = data.username;

      document.querySelector(".nav-bar .profile .profile-actions").classList.add("active");
    } else {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.log(error.message, "error");
  }
});


document.getElementById("logout").addEventListener("click", async () => {
  try {
    const response = await fetch(`https://crappie-warm-squirrel.ngrok-free.app/logout`, {
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
  const transition = document.getElementById("page-transition");
  const content = document.querySelector("body");

  if (!transition) return window.location.href = href;

  content.classList.remove("hidden-content");

  transition.classList.remove("active");

  window.location.href = "statistics.html"
})



