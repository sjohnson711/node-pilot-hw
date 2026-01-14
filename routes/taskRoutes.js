// routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const {
  index,
  show,
  create,
  update,
  deleteTask,
  bulkCreate
} = require("../controllers/taskController");

router.get("/", index);
router.get("/:id", show);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", deleteTask);
router.post("/:id", bulkCreate)

module.exports = router;