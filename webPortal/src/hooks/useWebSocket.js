// src/hooks/useWebSocket.js
import { useEffect, useState, useRef } from 'react';
import { useAuth } from './useAuth';

export const useWebSocket = (channel) => {
  const [lastMessage, setLastMessage] = useState(null);
  const [readyState, setReadyState] = useState(false);
  const wsRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/ws/${channel}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setReadyState(true);
      // Authenticate WebSocket connection
      ws.send(JSON.stringify({
        type: 'auth',
        userId: user.userId
      }));
    };

    ws.onmessage = (event) => {
      setLastMessage(event);
    };

    ws.onclose = () => {
      setReadyState(false);
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          useWebSocket(channel);
        }
      }, 5000);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, channel]);

  const sendMessage = (data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  return { lastMessage, readyState, sendMessage };
};