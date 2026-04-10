import { useEffect } from "react";
import { getSocket } from "../socket";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { apiSlice } from "../services/apiSlice";

const NotificationHandler = ({ userId }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();
    if (!socket) return;

    const handleNotification = (data) => {
      console.log("🔔 Notification:", data);

      toast(data.message);

      // 🔥 auto refresh notification list
      dispatch(apiSlice.util.invalidateTags(["Notification"]));
    };

    socket.on("notification", handleNotification);

    return () => socket.off("notification", handleNotification);
  }, [userId, dispatch]);

  return null;
};

export default NotificationHandler;