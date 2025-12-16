const { StatusCodes } = require("http-status-codes");

//Going to create all the request handler functions in this file such as create, index, show, update, deleteTask
const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

/////////////////////////CREATE///////////////////////////
const create = (req, res) => {
  if (!global.user_id) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Not Logged in" });
  }
  if (!req.body) req.body = {};
  const newTask = {
    ...req.body,
    isCompleted: req.body.isCompleted ?? false,
    id: taskCounter(),
    userId: global.user_id.email,
  };

  global.tasks.push(newTask);

  const { userId, ...sanitizedTask } = newTask;

  res.status(201).json(sanitizedTask);
};

//if there are no params, the ? makes sure that you get a null
///////////////////////////DELETE//////////////////////////
const deleteTask = (req, res) => {
  const taskToFind = parseInt(req.params?.id);
  if (!taskToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid " });
  }
  //we get the index, not the task, so that we can splice it
  const taskIndex = global.tasks.findIndex(
    (task) => task.id === taskToFind && task.userId === global.user_id?.email
  ); //---> if we can find the task and user has the right email!

  if (taskIndex === -1) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
    //else it's a 404
  }

  const { userId, ...task } = global.tasks[taskIndex]; //make a copy without the userId
  global.tasks.splice(taskIndex, 1); //do the delete
  return res.json(task); //return the entry just deleted. The default status code, OK, is returned.
};

//////////////////////INDEX/////////////////////////////
const index = (req, res) => {
  const userTasks = global.tasks.filter(
    (task) => task.userId === global.user_id.email
  );
  if (userTasks.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Not Found" });
  }

  const sanitizedTask = userTasks.map(({ userId, ...task }) => task); //removes userId -----> sanitizes the data
  res.status(200).json(sanitizedTask);
};
//////////////////////////////Update/////////////////
const update = (req, res) => {
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({ message: "The task ID passed is not valid" });
  }
  const currentTask = global.tasks.find(
    (task) => task.userId === global.user_id?.email && task.id === taskId
  );

  if (!currentTask) {
    return res.status(404).json({ message: "That task was not found" });
  }
  Object.assign(currentTask, req.body);

  const { userId, ...sanitizedTask } = currentTask;
  res.json(sanitizedTask);
};

//////////////////SHOW///////////////////////////
const show = (req, res) => {
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({ message: "Not able to show" });
  }
  const task = global.tasks.find(
    (task) => task.id === taskId && task.userId === global.user_id?.email
  );

  if (!task) {
    return res.status(404).json({ message: "That task was not found" });
  }

  const { userId, ...sanitizedTask } = task;
  res.json(sanitizedTask);
};

module.exports = {
  create,
  index,
  update,
  deleteTask,
  show,
};
