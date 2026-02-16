import User from "../../models/user/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Sign Up
export const signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Name, email, and password are required" 
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid email format" 
            });
        }
        
        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: "Password must be at least 6 characters long" 
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                message: "User with this email already exists" 
            });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const user = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || "farmer",
            isActive: true
        });
        
        await user.save();
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "7d" }
        );
        
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Email and password are required" 
            });
        }
        
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }
        
        // Check if account is active
        if (user.isActive === false) {
            return res.status(403).json({ 
                success: false, 
                message: "Account has been deactivated. Please contact support" 
            });
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "7d" }
        );
        
        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// View Account
export const viewAccount = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Find user by ID
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }
        
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Deactivate Account
export const deactivateAccount = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }
        
        // Check if already deactivated
        if (user.isActive === false) {
            return res.status(400).json({ 
                success: false, 
                message: "Account is already deactivated" 
            });
        }
        
        // Deactivate account
        user.isActive = false;
        await user.save();
        
        res.status(200).json({
            success: true,
            message: "Account deactivated successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All Users (Admin only)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

