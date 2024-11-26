document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".approve").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const notificationId = event.target.getAttribute("data-notification-id");
      await handleNotificationAction(notificationId, "approve");
    });
  });

  document.querySelectorAll(".reject").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const notificationId = event.target.getAttribute("data-notification-id");
      await handleNotificationAction(notificationId, "reject");
    });
  });
});

async function handleNotificationAction(notificationId, action) {
  try {
    const response = await fetch(
      `/applicant/notifications/${notificationId}/${action}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();
    if (result.success) {
      if (action === "approve") {
        window.location.href = `/applicant/view-verified-certificates`; // Redirect after approval
      } else {
        alert(`Notification ${action}d successfully.`);
        location.reload(); // Reload the page to reflect the changes
      }
    } else {
      alert(`Failed to ${action} notification.`);
    }
  } catch (error) {
    console.error(`Error ${action}ing notification:`, error);
    alert(`Error ${action}ing notification.`);
  }
}
