import jwt from "jsonwebtoken";
import User from "../models/user/CoreIdentity.js";

// Authenticate user with JWT token
export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }
        
        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided. Please login to continue."
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        
        // Get user from token and attach to request
        const user = await User.findById(decoded.userId).select("-password");
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found. Token is invalid."
            });
        }
        
        // Check if user account is active
        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Account has been deactivated. Please contact support."
            });
        }
        
        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token. Please login again."
            });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired. Please login again."
            });
        }
        return res.status(500).json({
            success: false,
            message: "Authentication failed. " + error.message
        });
    }
};

// Authorize based on roles
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please login first."
            });
        }
        
        // Check if user's role is in the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. This feature requires ${allowedRoles.join(" or ")} role.`,
                userRole: req.user.role,
                requiredRoles: allowedRoles
            });
        }
        
        next();
    };
};

// Admin only access
export const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please login first."
        });
    }
    
    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. This feature is only available to administrators.",
            userRole: req.user.role
        });
    }
    
    next();
};

// Farmer/Regular user only access
export const farmerOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please login first."
        });
    }
    
    if (req.user.role !== "farmer") {
        return res.status(403).json({
            success: false,
            message: "Access denied. This feature is only available to farmers.",
            userRole: req.user.role
        });
    }
    
    next();
};

// Check if the user is accessing their own resource
export const isSelfOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please login first."
        });
    }
    
    const userId = req.params.userId || req.params.id;
    
    // Allow if admin or if accessing own resource
    if (req.user.role === "admin" || req.user._id.toString() === userId) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied. You can only access your own resources."
        });
    }
};
