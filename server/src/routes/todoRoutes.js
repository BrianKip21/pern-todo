
import express from "express";

import {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
} from "../controllers/todoController.js";

import validateTodoId from "../middleware/validateTodoId.js";
import authenticate from "../middleware/authMiddleware.js";

const router = express.Router();

// All Todo routes require authentication.
router.use(authenticate);

router.get("/", getTodos);
router.get("/:id", validateTodoId, getTodoById);
router.post("/", createTodo);
router.patch("/:id", validateTodoId, updateTodo);
router.delete("/:id", validateTodoId, deleteTodo);

export default router;
