import { StatusCodes } from "http-status-codes"

const validateTodoId = (req, res, next) => {
    const { id } = req.params;

    const isValid =
        /^\d+$/.test(id) &&
        Number.isSafeInteger(Number(id)) &&
        Number(id) > 0;

    if (!isValid) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Invalid todo ID",
        });
    }

    next();
};

export default validateTodoId;
