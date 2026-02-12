import { useEffect, useRef, useState } from "react";
import { WS_EVENTS } from "@shared/schema";

type WSMessage = {
  type: string;
  payload: any;
};

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, (payload: any) => void>>(new Map());

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        const handler = handlersRef.current.get(message.type);
        if (handler) {
          handler(message.payload);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message", err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const send = (type: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  const on = (type: string, handler: (payload: any) => void) => {
    handlersRef.current.set(type, handler);
    return () => {
      handlersRef.current.delete(type);
    };
  };

  return { isConnected, send, on };
}
