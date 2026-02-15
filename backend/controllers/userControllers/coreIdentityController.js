import User from "../../models/user/CoreIdentity.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { coreIdentityFields } from "../../models/user/CoreIdentity.js";



// Validate required core identity input
export const validateCoreIdentityInput = ({ fullName, phoneNumber, password, email }) => {
    if (!fullName || !phoneNumber || !password) {
        return "Full name, phone number, and password are required";
    }

    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return "Invalid email format";
        }
    }

    if (password.length < 6) {
        return "Password must be at least 6 characters long";
    }

    return null;
};

// Build core identity data object for persistence
export const buildCoreIdentityData = ({
    fullName,
    phoneNumber,
    email,
    hashedPassword,
    dateOfBirth,
    gender
}) => ({
    fullName,
    phoneNumber,
    email: email ? email.toLowerCase() : undefined,
    password: hashedPassword,
    dateOfBirth,
    gender
});

// ========== Main User Handlers (Core Identity-focused) ==========

// Sign Up
export const signup = async (req, res) => {
    try {
        const {
            // Core Identity Information
            fullName,
            phoneNumber,
            email,
            password,
            dateOfBirth,
            gender
        } = req.body;

        // Validate core identity data
        const validationError = validateCoreIdentityInput({ fullName, phoneNumber, password, email });
        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        // Check if user already exists by phone or email
        const existingUser = await User.findOne({
            $or: [
                { phoneNumber },
                ...(email ? [{ email: email.toLowerCase() }] : [])
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with this phone number or email already exists"
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const coreIdentityData = buildCoreIdentityData({
            fullName,
            phoneNumber,
            email,
            hashedPassword,
            dateOfBirth,
            gender
        });

        // Create new user with default role
        const user = new User({
            ...coreIdentityData,
            role: "farmer",
            isActive: true
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                phoneNumber: user.phoneNumber,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "7d" }
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Login (supports phone number as primary, email as fallback)
export const login = async (req, res) => {
    try {
        const { phoneNumber, email, password } = req.body;

        // Require either phoneNumber or email
        if ((!phoneNumber && !email) || !password) {
            return res.status(400).json({
                success: false,
                message: "Phone number or email and password are required"
            });
        }

        // Build query with preference for phone number
        let userQuery = {};
        if (phoneNumber) {
            userQuery = { phoneNumber };
        } else if (email) {
            userQuery = { email: email.toLowerCase() };
        }

        const user = await User.findOne(userQuery);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid login credentials"
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
                message: "Invalid login credentials"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                phoneNumber: user.phoneNumber,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "7d" }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// View Account (Core Identity only - for profile display)
export const viewAccount = async (req, res) => {
    try {
        const { userId } = req.params;

        // Get only core identity fields
        const coreFieldNames = Object.keys(coreIdentityFields);
        const user = await User.findById(userId).select(coreFieldNames.join(" "));
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Build response with only core identity data
        const coreIdentity = {};
        coreFieldNames.forEach((field) => {
            if (field !== "password") { // Exclude password from response
                coreIdentity[field] = user[field];
            }
        });

        res.status(200).json({
            success: true,
            user: coreIdentity
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

// Get All Users - Returns core identity only
export const getAllUsers = async (req, res) => {
    try {
        const coreFieldNames = Object.keys(coreIdentityFields);
        const users = await User.find()
            .select(coreFieldNames.join(" "))
            .select("-password")
            .sort({ createdAt: -1 });

        // Map to only include core identity fields
        const coreIdentityUsers = users.map(user => {
            const coreData = {};
            coreFieldNames.forEach((field) => {
                if (field !== "password") {
                    coreData[field] = user[field];
                }
            });
            return coreData;
        });

        res.status(200).json({
            success: true,
            count: coreIdentityUsers.length,
            users: coreIdentityUsers
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

