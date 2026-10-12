import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import pool from "./db/db.js"
import todoRoutes from "./routes/todoRoutes.js"
import { errorHandler } from "./middleware/errorHandler.js"
import authRoutes from "./routes/authRoutes.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/v1/todos", todoRoutes)
app.use("/api/v1/auth", authRoutes)

app.use(errorHandler)

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`)
})