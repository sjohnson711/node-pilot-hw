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

//error handling
app.use((req, res, next) => {
	res.status(500).json({
		error: "Internal Servor Error", 
		requestId: req.requestID
	})
})

//limit the request sizing
app.use(express.json({ limit: '1mb'})) //----> helps protect the server from denial of service


//content-type validation
app.use((req, res, next) => {
	if(req.method === 'POST'){
		const contentType = req.get('Content-Type')
		if(!contentType || !contentType.includes('application/json')){
			return res.status(400).json({ 
				error: "Content-Type must be application/json",
				requestId: req.requestID
			})
		}
	}
	next();
})


//404 Handler
app.use((req, res, next) => {
	res.status(404).json({
		error: "Route not found", 
		requestId: req.requestId
	})
})




const validatingHeaders = (req, res, next) => {
  const contentType = req.headers["content-type"];
  if (!contentType || !contentType.includes("application/json")) {
    res.status(400).json({ message: "wrong data" });
    next();
  }
};
app.use(validatingHeaders);



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
