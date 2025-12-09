const express = require("express");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const dogsRouter = require("./routes/dogs");

const app = express();

// ------------------------------------------------
// 1. Request ID middleware
// ------------------------------------------------
app.use((req, res, next) => {
  req.requestId = uuidv4(); // fixed typo: was requestID
  res.setHeader("X-Request-Id", req.requestId); // fixed typo
  next();
});

// ------------------------------------------------
// 2. Logging Middleware with using the request body
// ------------------------------------------------
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);
  next();
});

// ------------------------------------------------------->
// 3. Security Headers ---> make sure that I explore this
// ------------------------------------------------------->
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY"); // fixed casing
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// ------------------------------------------------>
// 4. limit the request sizing to protect servers
// ------------------------------------------------>
app.use(express.json({ limit: "1mb" })); //----> helps protect the server from denial of service

// ------------------------------------------------>
// 5. Validate Content-Type on Post request
// ------------------------------------------------>
app.use((req, res, next) => {
  if (req.method === "POST") {
    const contentType = req.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      return res.status(400).json({
        //-----> Bad Request
        error: "Content-Type must be application/json",
        requestId: req.requestId, 
      });
    }
  }
  next();
});

//first test that I needed to allow the app to use the files where images are
app.use("/images", express.static(path.join(__dirname, "public/images")));

//--------------------------------------------------->
// 6. Routes from the router creates in routes
//--------------------------------------------------->
app.use("/", dogsRouter); // Do not remove this line

//--------------------------------------------------->
// 8. Custom Error Classes
//--------------------------------------------------->

class ValidationError extends Error {
  constructor(message) {
    super(message); // ----> allows the constructor to set error message
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

class UnauthorizedError extends Error {
  // fixed class name
  constructor(message) {
    super(message);
    this.name = "UnauthorizedError"; // fixed typo
    this.statusCode = 401;
  }
}

class DefaultErrors extends Error {
  constructor(message) {
    super(message);
    this.name = "Internal Server Error";
    this.statusCode = 500;
  }
}

//----------------------------------------------------------->
//9. Error Handling Middleware -----> !important always last
//----------------------------------------------------------->
app.use((err, req, res, next) => {
  // Determine the status code from the error
  const statusCode = err.statusCode || 500;

  // Log based on error type
  if (statusCode >= 400 && statusCode < 500) {
    console.warn(`WARN: ${err.name} ${err.message}`);
  } else {
    console.error(`ERROR: Error`);
  }

  // Send error response
  res.status(statusCode).json({
    error: err.message || "Internal Server Error",
    requestId: req.requestId,
  });
});

//--------------------------------------------------->
// 7. 404 Handler
//--------------------------------------------------->
app.use((req, res, next) => {
  res.status(404).json({
    error: "Route not found",
    requestId: req.requestId,
  });
});

(module.exports = ValidationError),
  UnauthorizedError,
  DefaultErrors,
  NotFoundError; // Do not remove this line

// Do not remove this line
if (require.main === module) {
  app.listen(3000, () => console.log("Server listening on port 3000"));
}
module.exports = app;
