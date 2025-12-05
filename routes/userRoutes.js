const express = require("express");

const router = express.Router(); //=====> creating the routes
const { register } = require("../controllers/userController");

router.route("/").post(register);

module.exports = router;
