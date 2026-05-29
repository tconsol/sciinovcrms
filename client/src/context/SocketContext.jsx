import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

export function SocketProvider({ children }) {
  const queryClient = useQueryClient();
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    socket.on('clients:changed', () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    });

    socket.on('payments:changed', () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    });

    socket.on('followups:changed', () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    });

    socket.on('admin:changed', () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    });

    return () => socket.disconnect();
  }, [queryClient]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
