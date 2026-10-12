
import axiosInstance from "./axiosInstance.js";

// Register a new user.
export const registerUser = async (userData) => {
  const response = await axiosInstance.post(
    "/auth/register",
    userData
  );

  return response.data;
};

// Log in an existing user.
export const loginUser = async (credentials) => {
  const response = await axiosInstance.post(
    "/auth/login",
    credentials
  );

  return response.data;
};

// Retrieve the currently authenticated user.
export const getCurrentUser = async () => {
  const response = await axiosInstance.get("/auth/me");

  return response.data;
};

// Log out the current user.
export const logoutUser = async () => {
  const response = await axiosInstance.post("/auth/logout");

  return response.data;
};
