import { useEffect, useState, useContext } from "react";
import { MinutesContext } from "../context/MinutesContext";
import { fetchNotifications } from "../services/minutesApi";

const Notifications = () => {
  const { backendUrl, token } = useContext(MinutesContext);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications(backendUrl, token).then(
      ({ data }) => data.success && setNotifications(data.notifications)
    );
  }, []);

  return (
    <div className="mt-4 pb-24 max-w-lg">
      <h1 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h1>
      <div className="flex flex-col gap-3">
        {notifications.map((n) => (
          <div key={n._id} className="border border-gray-200 rounded p-3">
            <p className="text-sm font-medium text-gray-800">{n.title}</p>
            <p className="text-xs text-gray-500">{n.message}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(n.date).toLocaleString()}</p>
          </div>
        ))}
        {notifications.length === 0 && <p className="text-sm text-gray-400">No notifications yet.</p>}
      </div>
    </div>
  );
};

export default Notifications;
