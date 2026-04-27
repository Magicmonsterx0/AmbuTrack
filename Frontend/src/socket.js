import { io } from 'socket.io-client';

//Single connection for whole react app shared
const URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket = io(URL, {
    autoConnect: true,
    reconnection: true,
});