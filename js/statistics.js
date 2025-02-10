function formatSeondsToHMS(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(date) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const [year, month, day] = date.split("-");

  return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}`
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("http://127.0.0.1:8000/get_profile_information", {
      method: "GET",
      credentials: "include",
    })

    if (response.status === 401) {
      window.location.href = "index.html"
    } else if (response.ok) {
      const data = await response.json();

      const username = document.querySelector(".profile .username")
      username.textContent = data.username;
      document.getElementById("profile-username-text").textContent = data.username;
      document.getElementById("profile-username-date").textContent = `Joined ${formatDate(data.registration_date)}`;
      document.getElementById("started-test").textContent = data.started_tests;
      document.getElementById("completed-test").textContent = data.completed_tests;
      document.getElementById("typing-time").textContent = formatSeondsToHMS(data.typing_duration)

    } else {
      throw new Error(response.statusText);}
  } catch (error) {
    console.log(error.message, "error");
  }
})
