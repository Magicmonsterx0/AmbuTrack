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
    // Allow falling back to long-polling if WebSocket is blocked (common on free hosting)
    transports: ['websocket', 'polling'],
});

// ---------------------------------------------------------------------------
// In-memory store: tracks active patient requests so we can notify the right
// patient socket when a driver accepts.
// Structure: { [patientSocketId]: { location, socketId } }
// ---------------------------------------------------------------------------
const pendingRequests = {};

io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    // -------------------------------------------------------------------------
    // DRIVER GOES ONLINE
    // Verifies JWT, joins the 'active-drivers' room, updates DB status.
    // FIX: We only update DB once here, not on every GPS tick.
    // -------------------------------------------------------------------------
    socket.on('go-online', async (data) => {
        try {
            if (!data.token) {
                return socket.emit('auth-error', { message: 'Access Denied: No Token' });
            }

            const decoded = jwt.verify(data.token, process.env.JWT_SECRET);

            // Join the room that receives patient emergency broadcasts
            socket.join('active-drivers');

            // Save driver's current location AND socket ID so we can target them later
            await Vehicle.findOneAndUpdate(
                { plateNumber: decoded.plateNumber },
                {
                    status: 'Online',
                    currentLocation: data.location,  // FIX: matches schema field name
                    socketId: socket.id,              // FIX: schema now has this field
                },
                { upsert: true }
            );

            console.log(`🚑 ${decoded.plateNumber} is Online.`);

            // Tell the Fleet page to refresh its data
            io.emit('driver-status-updated');

        } catch (err) {
            console.error('go-online auth error:', err.message);
            socket.emit('auth-error', { message: 'Access Denied: Invalid Token' });
        }
    });

    // -------------------------------------------------------------------------
    // DRIVER LOCATION UPDATE (called continuously by watchPosition)
    // FIX: Separated from go-online so we don't re-verify JWT on every GPS tick.
    // Just updates the DB location silently — no auth needed, socket already
    // joined the room via go-online.
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
    // FIX: We store the patient's socket ID in pendingRequests so when a driver
    // accepts, we know exactly which socket to notify.
    // We broadcast to 'active-drivers' room — only online drivers get this.
    // -------------------------------------------------------------------------
    socket.on('request-ambulance', (data) => {
        console.log(`🚨 Emergency from patient ${socket.id} at`, data.location);

        // Remember this patient so we can reach them after driver accepts
        pendingRequests[socket.id] = {
            location: data.location,
            socketId: socket.id,
        };

        // Broadcast to every driver in the active-drivers room
        // We attach the patient's socket ID so the driver can reference it on accept
        io.to('active-drivers').emit('incoming-ride', {
            patientId: socket.id,   // driver will send this back on accept
            location: data.location,
        });
    });

    // -------------------------------------------------------------------------
    // DRIVER ACCEPTS RIDE
    // FIX: Use socket.to(patientSocketId) to send directly to that one patient.
    // FIX: Plate number comes from JWT decode, not hardcoded.
    // -------------------------------------------------------------------------
    socket.on('accept-ride', async (data) => {
        try {
            if (!data.token) {
                return socket.emit('auth-error', { message: 'Access Denied: No Token' });
            }

            const decoded = jwt.verify(data.token, process.env.JWT_SECRET);

            const { patientId, driverLocation } = data;

            console.log(`✅ ${decoded.plateNumber} accepted ride for patient ${patientId}`);

            // FIX: socket.to() correctly sends to a specific socket ID
            // (io.to() also works but socket.to() is the cleaner targeted call)
            socket.to(patientId).emit('ride-accepted', {
                driverLocation,  // Patient's map will draw a line to this point
            });

            // Mark vehicle as busy in the database
            await Vehicle.findOneAndUpdate(
                { plateNumber: decoded.plateNumber },
                { status: 'Dispatched' }
            );

            // Clean up the pending request — it's been handled
            delete pendingRequests[patientId];

            io.emit('driver-status-updated');

        } catch (err) {
            console.error('accept-ride error:', err.message);
            socket.emit('auth-error', { message: 'Access Denied: Invalid Token' });
        }
    });

    // -------------------------------------------------------------------------
    // DRIVER COMPLETES RIDE
    // Verifies JWT + plate match, notifies patient, logs to DB.
    // -------------------------------------------------------------------------
    socket.on('complete-ride', async (data) => {
        try {
            if (!data.token) {
                return socket.emit('auth-error', { message: 'Access Denied: No Token' });
            }

            const decoded = jwt.verify(data.token, process.env.JWT_SECRET);

            // Security: make sure the driver isn't completing someone else's rescue
            if (decoded.plateNumber !== data.plateNumber) {
                console.warn(`⚠️ Plate mismatch: ${decoded.plateNumber} vs ${data.plateNumber}`);
                return socket.emit('auth-error', { message: 'Access Denied: Vehicle mismatch' });
            }

            console.log(`🏁 Rescue completed by ${decoded.plateNumber} for patient ${data.patientId}`);

            // Notify the patient their ride is done
            socket.to(data.patientId).emit('ride-completed');

            // Set vehicle back to available
            await Vehicle.findOneAndUpdate(
                { plateNumber: data.plateNumber },
                { status: 'Online' }
            );

            // Write the permanent dispatch record
            await new DispatchLog({
                patientId: data.patientId,
                vehiclePlate: data.plateNumber,
                pickupLocation: data.pickupLocation,
                status: 'Completed',
            }).save();

            console.log(`📝 Dispatch log saved for ${data.plateNumber}`);
            io.emit('driver-status-updated');

        } catch (err) {
            console.error('complete-ride error:', err.message);
            socket.emit('auth-error', { message: 'Access Denied: Invalid Token' });
        }
    });

    // -------------------------------------------------------------------------
    // DISCONNECT — clean up any pending requests from this socket
    // -------------------------------------------------------------------------
    socket.on('disconnect', async () => {
        console.log(`❌ Disconnected: ${socket.id}`);

        // If a patient disconnects, remove their pending request
        if (pendingRequests[socket.id]) {
            delete pendingRequests[socket.id];
        }

        // If a driver disconnects, mark their vehicle offline
        try {
            const updated = await Vehicle.findOneAndUpdate(
                { socketId: socket.id },
                { status: 'Offline', socketId: null }
            );
            if (updated) {
                console.log(`🚑 ${updated.plateNumber} marked Offline.`);
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