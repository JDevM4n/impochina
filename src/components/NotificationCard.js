import React from "react";

export default function NotificationCard({ notification }) {
  return (
    <div className="notification-card">
      <h3>{notification.title}</h3>
      <p>{notification.message}</p>
    </div>
  );
}