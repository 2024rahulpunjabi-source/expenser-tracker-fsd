import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { SOCKET_URL } from '../services/api';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [liveFeed, setLiveFeed] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Connect to WebSocket server
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('⚡ Connected to Real-Time WebSocket server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('⚡ Disconnected from WebSocket server');
    });

    // Online users update
    newSocket.on('users:online', (data) => {
      setOnlineCount(data.count || 1);
    });

    // Budget threshold warning
    newSocket.on('budget:alert', (alertData) => {
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 shadow-xl rounded-xl pointer-events-auto flex p-4`}
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                🚨 Budget Alert
              </p>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                {alertData.message}
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="ml-3 text-amber-600 hover:text-amber-900 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        ),
        { duration: 8000 }
      );

      setBudgetAlerts((prev) => [
        { ...alertData, id: Date.now(), timestamp: new Date() },
        ...prev.slice(0, 9),
      ]);
    });

    // Live activity feed
    newSocket.on('activity:feed', (activity) => {
      setLiveFeed((prev) => [activity, ...prev.slice(0, 19)]);
    });

    // Live chat message received
    newSocket.on('chat:message', (message) => {
      setChatMessages((prev) => {
        // Prevent duplicate appending
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });

    // Cleanup function on unmount or token change
    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  const sendChatMessage = (message, room = 'general') => {
    if (socket && isConnected) {
      socket.emit('chat:send', { message, room });
    }
  };

  const clearAlerts = () => {
    setBudgetAlerts([]);
  };

  const value = {
    socket,
    isConnected,
    onlineCount,
    budgetAlerts,
    chatMessages,
    setChatMessages,
    liveFeed,
    sendChatMessage,
    clearAlerts,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
