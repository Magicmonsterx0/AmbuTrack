import { io } from 'socket.io-client';

const URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

// autoConnect: false — we call socket.connect() manually inside Driver.jsx
// and Patient.jsx. This prevents a connection firing before the user is logged
// in, and ensures each page controls its own connection lifecycle.
//
// transports: both listed so Render's free tier can fall back to polling
// if the WebSocket upgrade is blocked on the first connection attempt.
export const socket = io(URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    transports: ['websocket', 'polling'],
});