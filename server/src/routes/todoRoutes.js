import express from "express";

import {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
} from "../controllers/todoController.js";

import validateTodoId from "../middleware/validateTodoId.js";

const router = express.Router();

router.get("/", getTodos);
router.get("/:id", validateTodoId, getTodoById);
router.post("/", createTodo);
router.patch("/:id", validateTodoId, updateTodo);
router.delete("/:id", validateTodoId, deleteTodo);

export default router;