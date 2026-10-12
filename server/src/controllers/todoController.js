
import pool from "../db/db.js";
import { StatusCodes } from "http-status-codes";
import CustomAPIError from "../utils/CustomAPIError.js";

// GET /api/todos
export const getTodos = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT id, user_id, title, description, completed,
                    priority, due_date, created_at, updated_at
             FROM todos
             ORDER BY created_at DESC`
        );

        res.status(StatusCodes.OK).json({
            success: true,
            count: result.rowCount,
            data: result.rows,
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/todos/:id
export const getTodoById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT id, user_id, title, description, completed,
                    priority, due_date, created_at, updated_at
             FROM todos
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            throw new CustomAPIError(
                "Todo not found",
                StatusCodes.NOT_FOUND
            );
        }

        res.status(StatusCodes.OK).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/todos
export const createTodo = async (req, res, next) => {
    try {
        const {
            user_id,
            title,
            description = null,
            priority = "medium",
            due_date = null,
        } = req.body;

        // Validate required fields.
        if (
            !Number.isSafeInteger(user_id) ||
            user_id < 1 ||
            typeof title !== "string" ||
            !title.trim()
        ) {
            throw new CustomAPIError(
                "A valid user_id and non-empty title are required",
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
            (typeof description !== "string" ||
                description.length > 10000)
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
                user_id,
                title.trim(),
                description,
                priority,
                due_date,
            ]
        );

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Todo created successfully",
            data: result.rows[0],
        });
    } catch (error) {
        // PostgreSQL foreign-key violation.
        if (error.code === "23503") {
            return next(
                new CustomAPIError(
                    "The specified user does not exist",
                    StatusCodes.BAD_REQUEST
                )
            );
        }

        next(error);
    }
};

// PATCH /api/todos/:id
export const updateTodo = async (req, res, next) => {
    try {
        const { id } = req.params;
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

        // Map permitted fields to their values.
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

        // Add the ID as the final query parameter.
        values.push(id);

        const result = await pool.query(
            `UPDATE todos
             SET ${setClauses.join(", ")},
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $${values.length}
             RETURNING id, user_id, title, description, completed,
                       priority, due_date, created_at, updated_at`,
            values
        );

        if (result.rows.length === 0) {
            throw new CustomAPIError(
                "Todo not found",
                StatusCodes.NOT_FOUND
            );
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: "Todo updated successfully",
            data: result.rows[0],
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/todos/:id
export const deleteTodo = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM todos
             WHERE id = $1
             RETURNING id`,
            [id]
        );

        if (result.rows.length === 0) {
            throw new CustomAPIError(
                "Todo not found",
                StatusCodes.NOT_FOUND
            );
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: "Todo deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};
