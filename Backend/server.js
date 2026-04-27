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
import DispatchLog from './models/DispatchLog.js'

dotenv.config();

// Connect to MongoDB using your .env file
connectDB();

const app = express();
const httpServer = createServer(app);

// 1. Define who is allowed to talk to your backend
const allowedOrigins = [
    'http://localhost:5173',
    'https://ambutrack.vercel.app',
    'https://ambutrack-jb3yrp5ep-magicmonsterx0s-projects.vercel.app'
];

// 2. Update Express CORS
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());
app.use('/api/fleet', fleetRoutes);
app.use('/api/auth', authRoutes);

// 3. Update Socket.io CORS
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

// Real-Time WebSocket Logic
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // 2. DRIVER GOES ONLINE (SECURED)
    socket.on('go-online', async (data) => {
        try {
            // 🔒 SECURITY CHECK: Verify the JWT Token
            if (!data.token) {
                console.log(`🚨 Unauthorized socket attempt blocked from ${socket.id}`);
                return socket.emit('auth-error', { message: "Access Denied: No Token Provided" });
            }

            // Decode the token using your secret key from the .env file
            const decoded = jwt.verify(data.token, process.env.JWT_SECRET);

            // If we get here, the token is 100% real and hasn't been tampered with.
            console.log(`✅ Verified Driver ${decoded.plateNumber} connecting...`);

            // --- YOUR EXISTING LOGIC GOES HERE ---
            socket.join('active-drivers');

            await Vehicle.findOneAndUpdate(
                { plateNumber: data.plateNumber },
                {
                    status: 'Online',
                    lastKnownLocation: data.location,
                    socketId: socket.id
                },
                { upsert: true }
            );

            console.log(`🚑 Vehicle ${data.plateNumber} is now Online.`);
            io.emit('driver-status-updated');

        } catch (error) {
            // If the token is fake, expired, or corrupted, jwt.verify() throws an error
            console.error(`🚨 Invalid Token detected from ${socket.id}:`, error.message);
            socket.emit('auth-error', { message: "Access Denied: Invalid Token" });
        }
    });

    // 2. PATIENT REQUESTS AMBULANCE
    socket.on('request-ambulance', (data) => {
        console.log("🚨 EMERGENCY RECEIVED AT:", data.location);

        // TARGETED DISPATCH: Only shout to the 'active-drivers' room!
        io.to('active-drivers').emit('incoming-ride', data);
    });

    // 3. DRIVER ACCEPTS RIDE
    socket.on('accept-ride', async (data) => {
        console.log(`✅ Driver accepted ride for Patient: ${data.patientId}`);
        io.to(data.patientId).emit('ride-accepted', { driverLocation: data.driverLocation });

        try {
            // Update MongoDB to show this ambulance is currently busy on a rescue!
            await Vehicle.findOneAndUpdate(
                { plateNumber: "UP16-AM-001" }, // Hardcoded for our test driver
                { status: 'Dispatched' }
            );
        } catch (error) {
            console.error("Database update failed:", error);
        }
    });

    // 4. DRIVER COMPLETES RIDE (SECURED)
    socket.on('complete-ride', async (data) => {
        try {
            // 🔒 SECURITY CHECK 1: Is there a token?
            if (!data.token) {
                console.log(`🚨 Unauthorized complete-ride attempt blocked from ${socket.id}`);
                return socket.emit('auth-error', { message: "Access Denied: No Token Provided" });
            }

            // 🔒 SECURITY CHECK 2: Is the token valid and signed by us?
            const decoded = jwt.verify(data.token, process.env.JWT_SECRET);

            // 🔒 SECURITY CHECK 3: Identity Verification
            // Prevent a rogue logged-in driver from completing a different driver's rescue!
            if (decoded.plateNumber !== data.plateNumber) {
                console.log(`🚨 Plate mismatch! Driver ${decoded.plateNumber} tried to modify ${data.plateNumber}`);
                return socket.emit('auth-error', { message: "Access Denied: Vehicle mismatch" });
            }

            console.log(`✅ Verified Driver ${decoded.plateNumber} completing rescue...`);

            // --- YOUR EXISTING LOGIC GOES HERE ---
            console.log(`🏁 Ride completed for Patient: ${data.patientId}`);
            io.to(data.patientId).emit('ride-completed');

            // 1. Update the ambulance status back to 'Online'
            await Vehicle.findOneAndUpdate(
                { plateNumber: data.plateNumber },
                { status: 'Online' }
            );

            // 2. Generate the permanent digital receipt
            const newLog = new DispatchLog({
                patientId: data.patientId,
                vehiclePlate: data.plateNumber,
                pickupLocation: data.pickupLocation,
                status: 'Completed'
            });
            await newLog.save();

            console.log(`📝 Official Dispatch Log created for rescue by ${data.plateNumber}`);

        } catch (error) {
            console.error(`🚨 Invalid Token detected during complete-ride from ${socket.id}:`, error.message);
            socket.emit('auth-error', { message: "Access Denied: Invalid Token" });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚑 AmbuTrack Backend running on port:${PORT}`);
});