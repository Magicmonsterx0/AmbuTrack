import mongoose from 'mongoose';

const dispatchLogSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true
    },
    vehiclePlate: {
        type: String,
        required: true
    },
    pickupLocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    status: {
        type: String,
        enum: ['Completed', 'Cancelled'],
        default: 'Completed'
    }
}, {
    timestamps: true // This will act as our official timestamp for when the rescue happened
});

const DispatchLog = mongoose.model('DispatchLog', dispatchLogSchema);
export default DispatchLog;