const express = require("express");

const router = express.Router(); //=====> creating the routes

const { register } = require("../controllers/userController");
const { userLogon, userLogoff } = require("../controllers/userController");

router.post("/", register);
router.post("/logon", userLogon);
router.post("/logoff", userLogoff);

module.exports = router;
//used to route to the correct urls