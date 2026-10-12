
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db/db.js";

// Cookie settings shared by login, registration, and logout.
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

// Create a JWT using the user's ID and email.
const createToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
};

// Register a new user.
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate the submitted fields.
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      typeof email !== "string" ||
      !email.trim() ||
      email.trim().length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message:
          "Provide a valid name, email, and password of 8–72 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check whether the email is already registered.
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rowCount > 0) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Hash the password before storing it.
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    const user = result.rows[0];

    // Create the JWT and place it in an HTTP-only cookie.
    const token = createToken(user);
    res.cookie("jwt", token, cookieOptions);

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Account created successfully.",
      data: { user },
    });
  } catch (error) {
    // Handle duplicate emails, including concurrent registrations.
    if (error.code === "23505") {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    next(error);
  }
};

// Log in an existing user.
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      email.trim().length > 255 ||
      !password
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, password_hash, created_at
       FROM users
       WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    const user = result.rows[0];

    // Use the same message for an unknown email and an incorrect password.
    if (
      !user ||
      !(await bcrypt.compare(password, user.password_hash))
    ) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Create the JWT and store it in the HTTP-only cookie.
    const token = createToken(user);
    res.cookie("jwt", token, cookieOptions);

    // Never send the password hash or JWT in the response.
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Return the currently authenticated user's details.
// This route must use your authentication middleware.
export const getMe = async (req, res, next) => {
  try {
    // Assumes your middleware sets req.user to the verified JWT payload.
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Fetch the user from the database rather than trusting
    // profile details supplied by the client.
    const result = await pool.query(
      `SELECT id, name, email, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      res.clearCookie("jwt", cookieOptions);

      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "User account not found.",
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// Log out by clearing the authentication cookie.
export const logout = (req, res) => {
  res.clearCookie("jwt", cookieOptions);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Logged out successfully.",
  });
};
