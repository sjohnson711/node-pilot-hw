const express = require("express");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const dogsRouter = require("./routes/dogs");

const app = express();

// Your middleware here
app.use((req, res, next) => {
	req.requestId = uuidv4()
	res.setHeader('X-request-Id', req.requestID) 
	next()
})

app.use((req, res, next) => {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`)
	next();
})



const validatingHeaders = (req, res, next) => {
  const contentType = req.headers["content-type"];
  if (!contentType || !contentType.includes("application/json")) {
    res.status(400).json({ message: "wrong data" });
    next();
  }
};
app.use(validatingHeaders);

//Error Handling Middleware
class Validation extends Error {
  constructor(message) {
    super(message);
    this.name = "Validation Error"; //set the error name ( used for error identification)
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

class Unauthorized extends Error {
  constructor(message) {
    super(message);
    this.name = "UnathorizedError";
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

app.use("/", dogsRouter); // Do not remove this line

(module.exports = app), Validation, Unauthorized, DefaultErrors, NotFoundError; // Do not remove this line

// Do not remove this line
if (require.main === module) {
  app.listen(3000, () => console.log("Server listening on port 3000"));
}
