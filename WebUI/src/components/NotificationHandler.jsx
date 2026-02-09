import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';

// Replace with your backend URL
const socket = io("http://localhost:5000"); 

const NotificationHandler = () => {
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user?._id) {
      // 1. Join the private room for this user
      socket.emit("join", user._id);

      // 2. Listen for the 'notification' event from backend
      socket.on("notification", (data) => {
        toast.success(data.message, {
          // Custom styling to match your Toaster theme
          icon: '🚀',
          style: {
            border: '1px solid #f97316',
            padding: '20px',
            color: '#fff',
          },
        });

        // Optional: Play a subtle notification sound
        // new Audio('/notification-sound.mp3').play().catch(() => {});
      });
    }

    return () => {
      socket.off("notification");
    };
  }, [user]);

  return null; // This component is invisible
};

export default NotificationHandler;