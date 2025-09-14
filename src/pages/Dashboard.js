import React, { useEffect, useState } from "react";
import { getNotifications } from "../api/notificationsService";
import NotificationCard from "../components/NotificationCard";

export default function Dashboard() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const notes = await getNotifications();
      setNotifications(notes);
    };
    fetchNotifications();
  }, []);

  return (
    <div className="dashboard-container">
      <h2>Notificaciones</h2>
      {notifications.length === 0 ? (
        <p>No hay notificaciones</p>
      ) : (
        notifications.map(n => <NotificationCard key={n._id} notification={n} />)
      )}
    </div>
  );
}
