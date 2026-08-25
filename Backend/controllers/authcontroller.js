import jwt from "jsonwebtoken";
import User from "../models/user.js";

// Generate JWT Token
const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "30d",
    }
  );
};

// Register User
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // Check if email already exists
    const exists = await User.findOne({
      email: email.toLowerCase(),
    });

    if (exists) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      avatar: name.charAt(0).toUpperCase(),
    });

    // Generate token
    const token = signToken(user._id);

    res.status(201).json({
      user,
      token,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    // Check password
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = signToken(user._id);
    res.status(200).json({user,token});
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const me = async (req, res) => {
  res.status(200).json({user: req.user});
};

export const updateProfile = async (req, res) => {
  try {
    const { name, morningMotivation } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    if (name !== undefined) {
        user.name = name;
        user.avatar = name.charAt(0).toUpperCase();
    }
    if (morningMotivation !== undefined) {
        user.morningMotivation = morningMotivation;
    }
    await user.save();
    res.json({ user });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};