import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import jwt from 'jsonwebtoken';

import fleetRoutes from './routes/fleetRoutes.js';
import authRoutes from './routes/authRoutes.js';
import Vehicle from './models/Vehicle.js';
import DispatchLog from './models/DispatchLog.js';

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
    'http://localhost:5173',
    'https://ambutrack.vercel.app',
    'https://ambutrack-jb3yrp5ep-magicmonsterx0s-projects.vercel.app'
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use('/api/fleet', fleetRoutes);
app.use('/api/auth', authRoutes);

const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
    // Allow fallback to polling if WebSocket is blocked (common on free hosting)
    transports: ['websocket', 'polling'],
});

// In-memory map of active patient requests.
// Key = patient's socket.id, Value = their location.
// Used so we know which socket to notify when a driver accepts.
const pendingRequests = {};

io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    // -------------------------------------------------------------------------
    // DRIVER GOES ONLINE
    // Verifies JWT once, joins 'active-drivers' room, writes to DB.
    // -------------------------------------------------------------------------
    socket.on('go-online', async (data) => {
        try {
            if (!data.token) {
                return socket.emit('auth-error', { message: 'Access Denied: No Token' });
            }

            const decoded = jwt.verify(data.token, process.env.JWT_SECRET);

            // Join the room — io.to('active-drivers') reaches all online drivers
            socket.join('active-drivers');

            await Vehicle.findOneAndUpdate(
                { plateNumber: decoded.plateNumber },
                {
                    status: 'Online',
                    currentLocation: data.location,
                    socketId: socket.id,
                },
                { upsert: true }
            );

            console.log(`🚑 ${decoded.plateNumber} is Online.`);
            io.emit('driver-status-updated');

        } catch (err) {
            console.error('go-online error:', err.message);
            socket.emit('auth-error', { message: 'Access Denied: Invalid Token' });
        }
    });

    // -------------------------------------------------------------------------
    // DRIVER GOES OFFLINE (explicit — button click)
    // Leaves the active-drivers room, marks vehicle Offline in DB.
    // This is separate from disconnect so it works even when the browser tab
    // stays open (disconnect only fires when the connection is actually lost).
    // -------------------------------------------------------------------------
    socket.on('go-offline', async (data) => {
        try {
            if (!data.token) {
                return socket.emit('auth-error', { message: 'Access Denied: No Token' });
            }

            const decoded = jwt.verify(data.token, process.env.JWT_SECRET);

            // Leave the dispatch room so new patient requests don't reach them
            socket.leave('active-drivers');

            await Vehicle.findOneAndUpdate(
                { plateNumber: decoded.plateNumber },
                { status: 'Offline', socketId: null }
            );

            console.log(`🔴 ${decoded.plateNumber} went Offline.`);
            io.emit('driver-status-updated');

        } catch (err) {
            console.error('go-offline error:', err.message);
            socket.emit('auth-error', { message: 'Access Denied: Invalid Token' });
        }
    });

    // -------------------------------------------------------------------------
    // DRIVER LOCATION UPDATE (fires on every GPS tick after go-online)
    // No JWT verify here — socket membership in 'active-drivers' is enough proof.
    // Just silently updates the DB. Cheap operation.
    // -------------------------------------------------------------------------
    socket.on('update-location', async (data) => {
        try {
            await Vehicle.findOneAndUpdate(
                { plateNumber: data.plateNumber },
                { currentLocation: data.location }
            );
        } catch (err) {
            console.error('Location update error:', err.message);
        }
    });

    // -------------------------------------------------------------------------
    // PATIENT REQUESTS AMBULANCE
    // Store patient socket ID server-side, then broadcast to all active drivers.
    // -------------------------------------------------------------------------
    socket.on('request-ambulance', (data) => {
        console.log(`🚨 Emergency from ${socket.id} at`, data.location);

        // Remember this patient so we can route the driver's accept back to them
        pendingRequests[socket.id] = {
            location: data.location,
            socketId: socket.id,
        };

        // Only drivers in the 'active-drivers' room receive this
        io.to('active-drivers').emit('incoming-ride', {
            patientId: socket.id,
            location: data.location,
        });
    });

    // -------------------------------------------------------------------------
    // DRIVER ACCEPTS RIDE
    // Verifies token, notifies the specific patient, marks vehicle Dispatched.
    // -------------------------------------------------------------------------
    socket.on('accept-ride', async (data) => {
        try {
            if (!data.token) {
                return socket.emit('auth-error', { message: 'Access Denied: No Token' });
            }

            const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
            const { patientId, driverLocation } = data;

            console.log(`✅ ${decoded.plateNumber} accepted ride for patient ${patientId}`);

            // Send directly to that one patient socket
            socket.to(patientId).emit('ride-accepted', { driverLocation });

            await Vehicle.findOneAndUpdate(
                { plateNumber: decoded.plateNumber },
                { status: 'Dispatched' }
            );

            delete pendingRequests[patientId];
            io.emit('driver-status-updated');

        } catch (err) {
            console.error('accept-ride error:', err.message);
            socket.emit('auth-error', { message: 'Access Denied: Invalid Token' });
        }
    });

    // -------------------------------------------------------------------------
    // DRIVER COMPLETES RIDE
    // Verifies token + plate match, notifies patient, logs to DB.
    // -------------------------------------------------------------------------
    socket.on('complete-ride', async (data) => {
        try {
            if (!data.token) {
                return socket.emit('auth-error', { message: 'Access Denied: No Token' });
            }

            const decoded = jwt.verify(data.token, process.env.JWT_SECRET);

            if (decoded.plateNumber !== data.plateNumber) {
                return socket.emit('auth-error', { message: 'Access Denied: Vehicle mismatch' });
            }

            console.log(`🏁 ${decoded.plateNumber} completed rescue for ${data.patientId}`);

            socket.to(data.patientId).emit('ride-completed');

            await Vehicle.findOneAndUpdate(
                { plateNumber: data.plateNumber },
                { status: 'Online' }
            );

            await new DispatchLog({
                patientId: data.patientId,
                vehiclePlate: data.plateNumber,
                pickupLocation: data.pickupLocation,
                status: 'Completed',
            }).save();

            io.emit('driver-status-updated');

        } catch (err) {
            console.error('complete-ride error:', err.message);
            socket.emit('auth-error', { message: 'Access Denied: Invalid Token' });
        }
    });

    // -------------------------------------------------------------------------
    // DISCONNECT (tab closed / network lost)
    // Auto-marks vehicle Offline so the DB never gets stuck in Online state.
    // -------------------------------------------------------------------------
    socket.on('disconnect', async () => {
        console.log(`❌ Disconnected: ${socket.id}`);

        if (pendingRequests[socket.id]) {
            delete pendingRequests[socket.id];
        }

        try {
            const updated = await Vehicle.findOneAndUpdate(
                { socketId: socket.id },
                { status: 'Offline', socketId: null }
            );
            if (updated) {
                console.log(`🚑 ${updated.plateNumber} auto-marked Offline.`);
                io.emit('driver-status-updated');
            }
        } catch (err) {
            console.error('Disconnect cleanup error:', err.message);
        }
    });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚑 AmbuTrack Backend running on port ${PORT}`);
});