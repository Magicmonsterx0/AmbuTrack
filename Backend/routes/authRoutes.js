import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// 🟢 REGISTER ROUTE (Used by Admins to add new drivers)
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, plateNumber } = req.body;

        // 1. Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // 2. Hash the password (The Security Layer!)
        const salt = await bcrypt.genSalt(10); // Generates a random string to mix with the password
        const hashedPassword = await bcrypt.hash(password, salt); // Scrambles them together

        // 3. Save the new secure user to the database
        const newUser = new User({
            name,
            email,
            password: hashedPassword, // Saving the scrambled hash, NOT the real password!
            role: role || 'driver',
            plateNumber
        });

        await newUser.save();

        console.log(`✅ Secure driver account created for: ${name}`);
        res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error during registration" });
    }


});

// 🔵 LOGIN ROUTE (Used by Drivers to access the terminal)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find the user by their email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // 2. Compare the raw password they just typed with the scrambled hash in the DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // 3. Generate the JWT (The VIP Wristband)
        const token = jwt.sign(
            { userId: user._id, role: user.role, plateNumber: user.plateNumber },
            process.env.JWT_SECRET, // Signed with your secret .env key!
            { expiresIn: '12h' } // Wristband expires after a 12-hour shift
        );

        // 4. Send the token back to the React frontend
        console.log(`🔓 Successful login for: ${user.name}`);
        res.json({
            message: "Login successful",
            token,
            driverData: {
                name: user.name,
                plateNumber: user.plateNumber
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
});

export default router;