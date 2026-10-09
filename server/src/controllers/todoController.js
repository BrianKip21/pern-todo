import pool from "../db/db.js";

// GET all todos

export const getTodos = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT id, user_id, title, description, completed, priority, due_date, created_at, updated_at
            FROM todos
            ORDER BY created_at DESC`
        );
        res.status(200).json({
            success: true,
            count: result.rowCount,
            data: result.rows,
        });
    } catch (error) {
        next(error);
    }
}

//GET by id

export const getTodoById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid todo ID",
            });
        }

        const result = await pool.query(
            `SELECT id, user_id, title, description, completed,
              priority, due_date, created_at, updated_at
            FROM todos
            WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Todo not found"
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0],
        })
    } catch (error) {
        next(error)
    }
}

// create todos
export const createTodo = async (req, res, next) => {
    try {
        const {
            user_id,
            title,
            description = null,
            priority = "medium",
            due_date = null,
        } = req.body

        if (
            !Number.isSafeInteger(user_id) ||
            user_id < 1 ||
            typeof title !== "string" ||
            !title.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid user_id and non-empty title are required",
            });
        }

        if (!["low", "medium", "high"].includes(priority)) {
            return res.status(400).json({
                success: false,
                message: "Priority must be low, medium, or high",
            });
        }

        if (title.trim().length > 255) {
            return res.status(400).json({
                success: false,
                message: "Title must be 255 characters or fewer",
            });
        }

        if (
            description !== null &&
            (typeof description !== "string" || description.length > 10000)
        ) {
            return res.status(400).json({
                success: false,
                message: "Description must be text of at most 10000 characters",
            });
        }

        if (
            due_date !== null &&
            (typeof due_date !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(due_date) ||
                !Number.isFinite(Date.parse(`${due_date}T00:00:00Z`)) ||
                new Date(`${due_date}T00:00:00Z`).toISOString().slice(0, 10) !== due_date)
        ) {
            return res.status(400).json({
                success: false,
                message: "due_date must be a valid date in YYYY-MM-DD format",
            });
        }

        const result = await pool.query(
            `INSERT INTO todos (user_id, title, description, priority, due_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, title, description, completed,
                 priority, due_date, created_at, updated_at`,
            [user_id, title.trim(), description, priority, due_date]
        );

        res.status(201).json({
            success: true,
            message: "Todo created successfully",
            data: result.rows[0],
        });
    } catch (error) {
        if (error.code === "23503") {
            return res.status(400).json({
                success: false,
                message: "The specified user does not exist",
            });
        }

        next(error);
    }
};

// PATCH /api/todos/:id
export const updateTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, completed, priority, due_date } = req.body;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid todo ID",
      });
    }

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
      updates.some((field) => !allowedFields.includes(field))
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update",
      });
    }

    if (
      title !== undefined &&
      (typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 255)
    ) {
      return res.status(400).json({
        success: false,
        message: "Title must contain 1–255 characters",
      });
    }

    if (
      description !== undefined &&
      description !== null &&
      (typeof description !== "string" || description.length > 10000)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid description",
      });
    }

    if (completed !== undefined && typeof completed !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "completed must be a boolean",
      });
    }

    if (
      priority !== undefined &&
      !["low", "medium", "high"].includes(priority)
    ) {
      return res.status(400).json({
        success: false,
        message: "Priority must be low, medium, or high",
      });
    }

    if (
      due_date !== undefined &&
      due_date !== null &&
      (typeof due_date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(due_date) ||
        !Number.isFinite(Date.parse(`${due_date}T00:00:00Z`)) ||
        new Date(`${due_date}T00:00:00Z`).toISOString().slice(0, 10) !== due_date)
    ) {
      return res.status(400).json({
        success: false,
        message: "due_date must be a valid YYYY-MM-DD date or null",
      });
    }

    const values = [];
    const setClauses = [];
    const fields = {
      title: title === undefined ? undefined : title.trim(),
      description,
      completed,
      priority,
      due_date,
    };

    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        values.push(fields[field]);
        setClauses.push(`${field} = $${values.length}`);
      }
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE todos
       SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length}
       RETURNING id, user_id, title, description, completed,
                 priority, due_date, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    res.status(200).json({
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

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid todo ID",
      });
    }

    const result = await pool.query(
      "DELETE FROM todos WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Todo deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};