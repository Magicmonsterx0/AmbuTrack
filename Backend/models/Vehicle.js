import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
    plateNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    driverName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Offline', 'Online', 'Dispatched', 'Maintenance'],
        default: 'Offline'
    },
    currentLocation: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 }
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt dates
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;