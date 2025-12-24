const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

//Going to create all the request handler functions in this file such as create, index, show, update, deleteTask
const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

/////////////////////////CREATE///////////////////////////
const create = async (req, res) => {
  if (!global.user_id) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Not Logged in" });
  }
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body);

  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: error.details[0].message });
  }

  const task = await pool.query(
    `INSERT INTO tasks(title, is_completed, user_id)
   VALUES ($1, $2, $3 )
   RETURNING id, title, is_completed`,
    [value.title, value.is_completed ?? false, global.user_id]
  );
  res.status(StatusCodes.CREATED).json(task.rows[0]);
};

//if there are no params, the ? makes sure that you get a null
///////////////////////////DELETE//////////////////////////
const deleteTask = async (req, res) => {
  const taskToFind = parseInt(req.params?.id);
  if (!taskToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid " });
  }
  //we get the index, not the task, so that we can splice it
  const result = await pool.query(
    `DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id, title, is_completed`,
    [taskToFind, global.user_id]
  );

  if (result.rows.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found " });
  }
  return res.status(StatusCodes.OK).json(result.rows[0]); //return the entry just deleted. The default status code, OK, is returned.
};

//////////////////////INDEX/////////////////////////////
const index = async (req, res) => {
  //===> Removed the filter function to findIndex ---> to search the database
  const tasks = await pool.query(
    `SELECT id, title, is_completed FROM tasks WHERE user_id = $1`, //==> instead of using userTask we find the task in query Where user_id matches protection
    [global.user_id]
  );
  if (tasks.rows.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Not Found" }); //if the task is not found it will respond with this
  }

  res.status(200).json(tasks.rows); //OK
};
//////////////////////////////Update/////////////////
const update = async (req, res) => {
  const taskId = parseInt(req.params?.id); //==> Is there an id

  if (!taskId) {
    return res.status(400).json({ message: "The task ID passed is not valid" });
  }

  //Validates the request body
  const { error, value } = patchTaskSchema.validate(req.body);
  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: error.details[0].message });
  }

  const taskChange = value;

  let keys = Object.keys(taskChange);
  keys = keys.map((key) => (key === "isCompleted" ? "is_completed" : key));
  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const idParm = `$${keys.length + 1}`;
  const userParm = `$${keys.length + 2}`;

  const values = [...Object.values(taskChange), taskId, global.user_id];

  const updatedTask = await pool.query(
    `UPDATE tasks SET ${setClauses} WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`,
    values
  );

  if (updatedTask.rowCount === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
  }

  res.status(StatusCodes.OK).json(updatedTask.rows[0]);
};

//////////////////SHOW///////////////////////////
const show = async (req, res) => {
  const taskId = parseInt(req.params.id);

  if (!taskId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Not able to show" });
  }

  const result = await pool.query(
    `SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2`,
    [taskId, global.user_id]
  );

  if (result.rows.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
  }
  res.status(StatusCodes.OK).json(result.rows[0]);
};
module.exports = {
  create,
  index,
  update,
  deleteTask,
  show,
};
