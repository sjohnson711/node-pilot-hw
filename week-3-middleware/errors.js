


//Error Handling Middleware
class Validation extends Error {
    constructor(message) {
      super(message);
      this.name = "Validation Error"; //set the error name ( used for error identification)
      this.statusCode = 400;
    }
  }

class NotFoundError extends Error {
    constructor(message){
        super(message);
        this.name = "NotFoundError"
        this.statusCode = 404
    }
}

class UnauthorizedError extends Error {
    constructor(message){
        super(message);
        this.name = "UnauthorizedError";
        this.statusCode = 401;
    }
}

module.exports = {Validation, NotFoundError, UnauthorizedError}