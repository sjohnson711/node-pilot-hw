const express = require("express");
const app = express();
const authMiddleware = require("./middleware/auth");
const prisma = require("./db/prisma");
const analyticsRoutes = require('./routes/analyticsRoutes')

const taskRouter = require("./routes/taskRoutes");
app.use("/api/tasks", authMiddleware, taskRouter); // -----> Auth get called so that if the user is not loggeeon they cannot access the tasks.

global.user_id = null;
global.users = []; //-------> Array of objects of users
global.tasks = []; //-------> using this in my taskController.js

const middleFunction = (req, res, next) => {
  console.log(
    `You have used ${req.method}, ${req.path}, and ${JSON.stringify(req.query)}`
  );
  next();
};

app.use(middleFunction);
app.use('/api/analyics', authMiddleware, analyticsRoutes)

app.use(express.json({ limit: "1kb" })); //parsing the body of the request json

app.get("/", (req, res) => {
  res.json({ message: "hello" });
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`Server is listening on port ${port}...`)
);

const userRouter = require("./routes/userRoutes.js");
app.use("/api/users", userRouter);

app.use("/api/users/logon", userRouter);
app.use("/api/users/logoff", userRouter);

const notFound = require("./middleware/not-found");
app.use(notFound);

const errorHandler = require("./middleware/error-handler");

app.use(errorHandler);

//health check added here
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT * WHERE id = ${id}`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", db: "not connected", error: err.message });
  }
});

//Exit Cleanly from Express Program
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

let isShuttingDown = false;
async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("Shutting down gracefully...");
  
  console.log("Prisma disconnected");
  try {
    await new Promise((resolve) => server.close(resolve));
    console.log("HTTP server closed.");
    // If you have DB connections, close them here
    await prisma.$disconnect(); // shuts down prisma
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    console.log("Exiting process...");
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0)); // ctrl+c
process.on("SIGTERM", () => shutdown(0)); // e.g. `docker stop`
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown(1);
});

app.post("./testpost", (req, res) => {
  res.send(`Post request received`);
});

//

module.exports = { app, server };
