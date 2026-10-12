
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

const authenticate = (req, res, next) => {
  try {
    // Read the JWT from the HTTP-only cookie.
    const token = req.cookies?.jwt;

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    // Verify the token before trusting its payload.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Make the authenticated user's details available to controllers.
    req.user = decoded;

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid or expired authentication token.",
      });
    }

    next(error);
  }
};

export default authenticate;
