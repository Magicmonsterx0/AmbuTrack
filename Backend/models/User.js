import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true // Prevents two drivers from using the same email
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['driver', 'admin'],
        default: 'driver'
    },
    plateNumber: {
        type: String,
        // Only required if they are a driver
        required: function() { return this.role === 'driver'; }
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;