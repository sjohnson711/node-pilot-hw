const express = require("express");

const router = express.Router(); //=====> creating the routes

const { register } = require("../controllers/userController");
const { logon, logoff } = require("../controllers/userController");

router.post("/register", register);
router.post("/logon", logon);
router.post("/logoff", logoff);

module.exports = router;
// used to route to the correct urls