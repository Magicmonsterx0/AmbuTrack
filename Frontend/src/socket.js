import { io } from 'socket.io-client';

//Single connection for whole react app shared
const URL = import.meta.env.VITE_BACKEND_URL;

export const socket = io(URL, {
    autoConnect: true,
    reconnection: true,
});