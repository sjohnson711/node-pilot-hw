// routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const {
  bulkCreate,
  index,
  show,
  create,
  update,
  deleteTask,
} = require("../controllers/taskController");
router.post("/bulk", bulkCreate);
router.get("/", index);
router.get("/:id", show);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", deleteTask);

module.exports = router;
