
import axiosInstance from "./axiosInstance.js";

// Get all todos
export const getTodos = async () => {
  const response = await axiosInstance.get("/todos");
  return response.data;
};

// Get one todo by ID
export const getTodoById = async (id) => {
  const response = await axiosInstance.get(`/todos/${id}`);
  return response.data;
};

// Create a new todo
export const createTodo = async (todoData) => {
  const response = await axiosInstance.post("/todos", todoData);
  return response.data;
};

// Update an existing todo
export const updateTodo = async (id, todoData) => {
  const response = await axiosInstance.patch(
    `/todos/${id}`,
    todoData
  );

  return response.data;
};

// Delete a todo
export const deleteTodo = async (id) => {
  const response = await axiosInstance.delete(`/todos/${id}`);
  return response.data;
};
