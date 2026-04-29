import { io } from 'socket.io-client';

// The backend URL comes from your Vercel environment variable VITE_API_URL.
// Strip any trailing slash so URLs like https://backend.onrender.com/ don't
// produce double-slashes when combined with paths.
const URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

// FIX: autoConnect is false — we connect manually inside each page that needs
// sockets (Driver.jsx, Patient.jsx). This prevents a stale connection being
// established before the user has even logged in.
//
// FIX: list both transports. Render's free tier sometimes blocks the initial
// WebSocket upgrade handshake; polling lets the connection succeed first and
// then upgrade automatically.
export const socket = io(URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,          // wait 2 s between retries
    transports: ['websocket', 'polling'],
});