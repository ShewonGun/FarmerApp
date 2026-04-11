import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../../models/user/User.js";

export const makeAuthHeader = (token) => ({ Authorization: `Bearer ${token}` });

export const signToken = (user) => {
  const payload = { userId: user._id.toString(), email: user.email, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });
};

export const createUserWithToken = async ({
  name,
  email,
  role = "farmer",
  password = "password123",
  isActive = true,
} = {}) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name || `${role} user`,
    email: email || `${role}${Date.now()}@example.com`,
    role,
    password: hashedPassword,
    isActive,
  });

  return {
    user,
    token: signToken(user),
    password,
  };
};
