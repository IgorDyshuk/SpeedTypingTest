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


function formatDateTime(datetime) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const utcDate = new Date(datetime + 'Z')

  const localDate = new Date(utcDate.getTime())

  const year = localDate.getFullYear();
  const month = monthNames[localDate.getMonth()];
  const day = localDate.getDate();
  const hours = localDate.getHours().toString().padStart(2, '0');
  const minutes = localDate.getMinutes().toString().padStart(2, '0');
  const seconds = localDate.getSeconds().toString().padStart(2, '0');

  return `${day} ${month} ${year} at ${hours}:${minutes}:${seconds}`
}

function updateBestScoreUI(data, time) {
  document.getElementById(`score-${time}`).textContent = data.wpm || `N/A`
  document.getElementById(`accuracy-${time}`).textContent = data.accuracy !== 'N/A' ? `${data.accuracy}%` : `N/A`
  document.getElementById(`date-${time}`).textContent = data.record_date !== 'N/A' ? formatDateTime(data.record_date) : "N/A"
}

function updateBestScores(data) {
  const selectedLang = document.querySelector('input[name="language"]:checked').value

  let language = "English words"
  let langKey = "eng_words"

  switch (selectedLang) {
    case "eng_words":
      language = "English words"
      langKey = "eng_words"
      break;
    case "ukr_words" :
      language = "Ukrainian words"
      langKey = "ukr_words"
      break;
    case "ru_words":
      language = "Russian words"
      langKey = "ru_words"
      break;
  }

  document.getElementById("Selected_lang").textContent = language

  const timeCategories = ['15', '30', '60']

  timeCategories.forEach(time => {
    const key = `${langKey}_${time}`
    if (data.best_score[key]) {
      updateBestScoreUI(data.best_score[key], `${time}sec`)
    } else {
      updateBestScoreUI({wpm: "N/A", accuracy: "N/A", record_date: "N/A"}, `${time}sec`)
    }
  })
}


async function fetchAndUpdate() {
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

      updateBestScores(data)

    } else {
      throw new Error(response.statusText);
    }
  } catch (error) {
    console.log(error.message, "error");
  }
}

window.addEventListener("DOMContentLoaded", fetchAndUpdate)

document.querySelectorAll("input[name='language']").forEach(lang => {
  lang.addEventListener("change", fetchAndUpdate);
});
