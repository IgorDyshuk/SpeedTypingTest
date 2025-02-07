// notifications.js
export function showNotification(message, type="success") {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = `notification ${type} visible`;

  notification.style.right = `-${notification.offsetWidth}px`;
  setTimeout(() => {
    notification.style.right = `20px`;
  }, 100);

  setTimeout(() => {
    notification.style.right = `-${notification.offsetWidth}px`;
    setTimeout(() => {
      notification.className = `notification hidden`;
    }, 300);
  }, 4000);
}
