
import axiosInstance from "./axiosInstance.js";

export const getTodos = async () => {
  return (await axiosInstance.get("/todos")).data;
};

export const createTodo = async (todoData) => {
  return (await axiosInstance.post("/todos", todoData)).data;
};

export const updateTodo = async (id, todoData) => {
  return (await axiosInstance.patch(`/todos/${id}`, todoData)).data;
};

export const deleteTodo = async (id) => {
  return (await axiosInstance.delete(`/todos/${id}`)).data;
};
