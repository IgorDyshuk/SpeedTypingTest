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
    const passwordField = this.previousElementSibling; 0

    const type = passwordField.getAttribute("type") === "password" ? "text" : "password";
    passwordField.setAttribute("type", type);

    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
  });
});

function showNotification(message, type="success") {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = `notification ${type} visible`

  notification.style.right = `-${notification.offsetWidth}px`
  setTimeout(() => {
    notification.style.right = `20px`
  }, 100)

  setTimeout(() => {
    notification.style.right = `-${notification.offsetWidth}px`
    setTimeout(() => {
      notification.styleName = `notification hidden`
    }, 300)
  }, 3000)
}

document.getElementById("sign-in-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.querySelector("#sign-in-form .email").value.trim();
  const password = document.querySelector("#sign-in-form .password").value.trim();

  console.log("Email:", email);
  console.log("Password:", password);

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

  } catch (error) {
    showNotification(error.message, "error");
  }
});

document.getElementById("sign-up-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.querySelector("#sign-up-form .username").value.trim();
  const email = document.querySelector("#sign-up-form .email").value.trim();
  const password = document.querySelector("#sign-up-form .password").value.trim();

  try {
    const response = await fetch("http://127.0.0.1:8000/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        username: username,
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

    if (!response.ok) {
      throw new Error("Not logged in");
    }

    const data = await response.json();

    const loginIcon = document.getElementById("login-icon")
    loginIcon.classList.remove("far")
    loginIcon.classList.add("fas")

    const username = document.querySelector(".profile .username")
    username.textContent = data.username;

  } catch (error) {
    showNotification(error.message, "error");
  }
});

document.getElementById("login-form").addEventListener("click", () => {
  const container = document.querySelector(".login-container")
  container.classList.add("open")
})

document.querySelectorAll(".toggle-panel .fa-times").forEach(toggle => {
  toggle.addEventListener("click", function () {
    const container = document.querySelector(".login-container")
    container.classList.remove("open")
  })
})

