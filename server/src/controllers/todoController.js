
import pool from "../db/db.js";
import { StatusCodes } from "http-status-codes";
import CustomAPIError from "../utils/CustomAPIError.js";

// GET /api/v1/todos
// Return only the authenticated user's todos.
export const getTodos = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT id, user_id, title, description, completed,
                    priority, due_date, created_at, updated_at
             FROM todos
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            count: result.rowCount,
            data: result.rows,
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/v1/todos/:id
// A user can only retrieve their own todo.
export const getTodoById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT id, user_id, title, description, completed,
                    priority, due_date, created_at, updated_at
             FROM todos
             WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        if (result.rowCount === 0) {
            throw new CustomAPIError(
                "Todo not found",
                StatusCodes.NOT_FOUND
            );
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/v1/todos
// The user ID comes from the verified JWT, not req.body.
export const createTodo = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const {
            title,
            description = null,
            priority = "medium",
            due_date = null,
        } = req.body;

        // Validate required fields.
        if (
            typeof title !== "string" ||
            !title.trim()
        ) {
            throw new CustomAPIError(
                "A non-empty title is required",
                StatusCodes.BAD_REQUEST
            );
        }

        // Validate priority.
        if (!["low", "medium", "high"].includes(priority)) {
            throw new CustomAPIError(
                "Priority must be low, medium, or high",
                StatusCodes.BAD_REQUEST
            );
        }

        // Validate title length.
        if (title.trim().length > 255) {
            throw new CustomAPIError(
                "Title must be 255 characters or fewer",
                StatusCodes.BAD_REQUEST
            );
        }

        // Validate description.
        if (
            description !== null &&
            (
                typeof description !== "string" ||
                description.length > 10000
            )
        ) {
            throw new CustomAPIError(
                "Description must be text of at most 10000 characters",
                StatusCodes.BAD_REQUEST
            );
        }

        // Validate due date.
        if (
            due_date !== null &&
            (
                typeof due_date !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(due_date) ||
                !Number.isFinite(
                    Date.parse(`${due_date}T00:00:00Z`)
                ) ||
                new Date(`${due_date}T00:00:00Z`)
                    .toISOString()
                    .slice(0, 10) !== due_date
            )
        ) {
            throw new CustomAPIError(
                "due_date must be a valid date in YYYY-MM-DD format",
                StatusCodes.BAD_REQUEST
            );
        }

        const result = await pool.query(
            `INSERT INTO todos
                (user_id, title, description, priority, due_date)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, user_id, title, description, completed,
                       priority, due_date, created_at, updated_at`,
            [
                userId,
                title.trim(),
                description,
                priority,
                due_date,
            ]
        );

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Todo created successfully",
            data: result.rows[0],
        });
    } catch (error) {
        // Handle foreign-key violations.
        if (error.code === "23503") {
            return next(
                new CustomAPIError(
                    "The authenticated user does not exist",
                    StatusCodes.BAD_REQUEST
                )
            );
        }

        next(error);
    }
};

// PATCH /api/v1/todos/:id
// Update only a todo belonging to the authenticated user.
export const updateTodo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const {
            title,
            description,
            completed,
            priority,
            due_date,
        } = req.body;

        // Only these fields may be updated.
        const allowedFields = [
            "title",
            "description",
            "completed",
            "priority",
            "due_date",
        ];

        const updates = Object.keys(req.body);

        if (
            updates.length === 0 ||
            updates.some(
                (field) => !allowedFields.includes(field)
            )
        ) {
            throw new CustomAPIError(
                "Provide at least one valid field to update",
                StatusCodes.BAD_REQUEST
            );
        }

        // Validate title.
        if (
            title !== undefined &&
            (
                typeof title !== "string" ||
                !title.trim() ||
                title.trim().length > 255
            )
        ) {
            throw new CustomAPIError(
                "Title must contain 1–255 characters",
                StatusCodes.BAD_REQUEST
            );
        }

        // Validate description.
        if (
            description !== undefined &&
            description !== null &&
            (
                typeof description !== "string" ||
                description.length > 10000
            )
        ) {
            throw new CustomAPIError(
                "Invalid description",
                StatusCodes.BAD_REQUEST
            );
        }

        // Validate completed.
        if (
            completed !== undefined &&
            typeof completed !== "boolean"
        ) {
            throw new CustomAPIError(
                "completed must be a boolean",
                StatusCodes.BAD_REQUEST
            );
        }

        // Validate priority.
        if (
            priority !== undefined &&
            !["low", "medium", "high"].includes(priority)
        ) {
            throw new CustomAPIError(
                "Priority must be low, medium, or high",
                StatusCodes.BAD_REQUEST
            );
        }

        // Validate due date.
        if (
            due_date !== undefined &&
            due_date !== null &&
            (
                typeof due_date !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(due_date) ||
                !Number.isFinite(
                    Date.parse(`${due_date}T00:00:00Z`)
                ) ||
                new Date(`${due_date}T00:00:00Z`)
                    .toISOString()
                    .slice(0, 10) !== due_date
            )
        ) {
            throw new CustomAPIError(
                "due_date must be a valid YYYY-MM-DD date or null",
                StatusCodes.BAD_REQUEST
            );
        }

        // Build updates using an explicit allowlist of column names.
        const fields = {
            title: title === undefined ? undefined : title.trim(),
            description,
            completed,
            priority,
            due_date,
        };

        const values = [];
        const setClauses = [];

        for (const field of allowedFields) {
            if (fields[field] !== undefined) {
                values.push(fields[field]);
                setClauses.push(
                    `${field} = $${values.length}`
                );
            }
        }

        // Restrict the update to this user's todo.
        values.push(id);
        const idParameter = values.length;

        values.push(userId);
        const userIdParameter = values.length;

        const result = await pool.query(
            `UPDATE todos
             SET ${setClauses.join(", ")},
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $${idParameter}
               AND user_id = $${userIdParameter}
             RETURNING id, user_id, title, description, completed,
                       priority, due_date, created_at, updated_at`,
            values
        );

        if (result.rowCount === 0) {
            throw new CustomAPIError(
                "Todo not found",
                StatusCodes.NOT_FOUND
            );
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Todo updated successfully",
            data: result.rows[0],
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/v1/todos/:id
// Delete only a todo belonging to the authenticated user.
export const deleteTodo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const result = await pool.query(
            `DELETE FROM todos
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [id, userId]
        );

        if (result.rowCount === 0) {
            throw new CustomAPIError(
                "Todo not found",
                StatusCodes.NOT_FOUND
            );
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Todo deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};
