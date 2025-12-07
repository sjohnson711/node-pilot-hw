const express = require("express");
const router = express.Router();
const dogs = require("../dogData.js");
const { ValidationError, NotFoundError } = require('../errors')
router.get("/dogs", (req, res) => {
  res.json(dogs);
});

router.post("/adopt", (req, res) => {
  const { name, address, email, dogName } = req.body;
  if (!name || !email || !dogName) {
    throw new ValidationError("Missing required Fields")
  }

  if(!dogs|| dogs.status !== 'available'){
    throw new NotFoundError("not found or not available")
  }
});

router.get("/error", (req, res) => {
  throw new Error("Test error");
});

module.exports = router;
