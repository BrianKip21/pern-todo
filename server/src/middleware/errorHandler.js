
import { StatusCodes } from "http-status-codes";

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    message:
      statusCode >= StatusCodes.INTERNAL_SERVER_ERROR
        ? "Internal server error"
        : err.message,
  });
};
