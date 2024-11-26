async function sendNotification(username, certificateID) {
  try {
    const response = await fetch("/company/send-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, certificateID }),
    });
    const result = await response.json();
    if (result.success) {
      alert("Notification sent successfully.");
    } else {
      alert("Failed to send notification.");
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    alert("Error sending notification.");
  }
}
