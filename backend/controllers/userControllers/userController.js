import User from "../../models/user/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const googleOAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                picture: typeof user.picture === "string" ? user.picture.trim() : (user.picture || "")
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

        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: "This email is registered with Google. Please sign in with Google."
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
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                picture: typeof user.picture === "string" ? user.picture.trim() : (user.picture || "")
            },
            token
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Google Sign-In (verify ID token, create or link user)
export const googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is required"
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({
                success: false,
                message: "Google sign-in is not configured on the server"
            });
        }

        const ticket = await googleOAuthClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const googleId = payload.sub;
        const email = payload.email?.toLowerCase();
        const name = payload.name || payload.given_name || "User";
        const picture = payload.picture || "";

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Google did not return an email for this account"
            });
        }

        if (!payload.email_verified) {
            return res.status(400).json({
                success: false,
                message: "Google account email is not verified"
            });
        }

        let user = await User.findOne({ googleId });

        if (!user) {
            const byEmail = await User.findOne({ email });
            if (byEmail) {
                byEmail.googleId = googleId;
                byEmail.picture = picture || byEmail.picture;
                byEmail.name = name || byEmail.name;
                await byEmail.save();
                user = byEmail;
            } else {
                user = new User({
                    name,
                    email,
                    googleId,
                    picture: picture || undefined,
                    role: "farmer",
                    isActive: true
                });
                await user.save();
            }
        } else {
            user.picture = picture || user.picture;
            user.name = name || user.name;
            await user.save();
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Account has been deactivated. Please contact support"
            });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "7d" }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                picture: typeof user.picture === "string" ? user.picture.trim() : (user.picture || "")
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Google sign-in failed"
        });
    }
};

// View Account
export const viewAccount = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId).lean();
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        const hasPassword = !!user.password;
        delete user.password;
        
        res.status(200).json({
            success: true,
            user: {
                ...user,
                id: user._id?.toString?.() ?? String(user._id),
                picture: typeof user.picture === "string" ? user.picture.trim() : (user.picture || ""),
                hasPassword
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Account
export const updateAccount = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (name !== undefined) {
            const trimmedName = name.trim();
            if (!trimmedName) {
                return res.status(400).json({
                    success: false,
                    message: "Name cannot be empty"
                });
            }
            user.name = trimmedName;
        }

        if (email !== undefined) {
            const normalizedEmail = email.trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid email format"
                });
            }

            const existingUser = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: userId }
            });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "User with this email already exists"
                });
            }

            user.email = normalizedEmail;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Account updated successfully",
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt,
                picture: typeof user.picture === "string" ? user.picture.trim() : (user.picture || "")
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Profile Picture
export const updateProfilePicture = async (req, res) => {
    try {
        const { userId } = req.params;
        const { picture } = req.body;

        if (typeof picture !== "string" || !picture.trim()) {
            return res.status(400).json({
                success: false,
                message: "Profile image URL is required"
            });
        }

        const trimmedPicture = picture.trim();
        const allowedProtocols = ["http://", "https://"];
        const isValidUrl = allowedProtocols.some((protocol) => trimmedPicture.startsWith(protocol));

        if (!isValidUrl) {
            return res.status(400).json({
                success: false,
                message: "Profile image URL must be a valid http/https URL"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.picture = trimmedPicture;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile image updated successfully",
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt,
                picture: typeof user.picture === "string" ? user.picture.trim() : (user.picture || "")
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Change Account Password
export const changePassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password, new password, and confirm password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "This account uses Google sign-in only. Password change is not available."
            });
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
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

// Activate Account
export const activateAccount = async (req, res) => {
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

        // Check if already active
        if (user.isActive !== false) {
            return res.status(400).json({
                success: false,
                message: "Account is already active"
            });
        }

        // Activate account
        user.isActive = true;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Account activated successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create Admin Account (Admin only)
export const createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required"
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const adminUser = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: "admin",
            isActive: true
        });

        await adminUser.save();

        res.status(201).json({
            success: true,
            message: "Admin account created successfully",
            user: {
                id: adminUser._id,
                name: adminUser.name,
                email: adminUser.email,
                role: adminUser.role,
                isActive: adminUser.isActive
            }
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

