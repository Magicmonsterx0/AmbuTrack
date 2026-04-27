import express from 'express';
import Vehicle from '../models/Vehicle.js'; // Importing your schema!

const router = express.Router();

// ROUTE 1: GET /api/fleet (Fetches all vehicles from MongoDB)
router.get('/', async (req, res) => {
    try {
        const fleet = await Vehicle.find({}); // Ask MongoDB for everything
        res.json(fleet); // Send it back to React
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// ROUTE 2: POST /api/fleet/seed (A quick hack to inject dummy data for testing)
router.post('/seed', async (req, res) => {
    try {
        await Vehicle.deleteMany({});

        const dummyFleet = [
            { plateNumber: "UP16-AM-001", driverName: "Ramesh Kumar", status: "Online", currentLocation: { lat: 28.4597, lng: 77.4954 } },
            { plateNumber: "UP16-AM-002", driverName: "Suresh Singh", status: "Offline", currentLocation: { lat: 28.4700, lng: 77.5000 } },
            { plateNumber: "DL01-AM-999", driverName: "Vikram Sharma", status: "Maintenance", currentLocation: { lat: 28.6139, lng: 77.2090 } }
        ];

        const createdVehicles = await Vehicle.insertMany(dummyFleet);
        res.status(201).json({ message: "Fleet Seeded Successfully!", data: createdVehicles });
    } catch (error) {
        console.error("Seed error:", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;