import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast'; // or your preferred toast library

const NotificationHandler = ({ userId }) => {
  useEffect(() => {
    if (!userId) return;

    // Connect to your backend
    const socket = io("http://localhost:5000", {
      query: { userId } 
    });

    // Join a private room based on User ID
    socket.emit("join", userId);

    // Listen for the "notification" event we defined in the backend
    socket.on("notification", (data) => {
      console.log("New notification received:", data);
      
      // Show a real-time toast
      toast(data.message, {
        icon: data.type === 'task' ? '🚀' : '⚠️',
        duration: 5000,
        style: {
          border: data.type === 'system' ? '1px solid #ef4444' : '1px solid #f97316',
          padding: '16px',
          color: '#1f2937',
        },
      });

      // Optional: If you have a Redux/Context state for notifications, update it here
      // dispatch(addNewNotification(data));
    });

    return () => socket.disconnect();
  }, [userId]);

  return null;
};

export default NotificationHandler;