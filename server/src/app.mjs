import express from "express";
import cors from "cors";
import routes from "./routes/index.mjs";
import { errorMiddleware } from "./middlewares/error.middleware.mjs";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server is running fine",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  return res.send("Welcome to API Server");
});

app.use("/", routes);
app.use(errorMiddleware);

export default app;