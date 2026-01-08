require("dotenv").config();
const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

//Going to create all the request handler functions in this file such as create, index, show, update, deleteTask

/////////////////////////CREATE///////////////////////////
const create = async (req, res, next) => {
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

  try {
    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.is_completed ?? false,
        userId: global.user_id,
      },
      select: { id: true, title: true, isCompleted: true },
    });
    res.status(StatusCodes.CREATED).json(task);
  } catch (err) {
    next(err);
  }
};

//if there are no params, the ? makes sure that you get a null
///////////////////////////DELETE//////////////////////////
const deleteTask = async (req, res, next) => {
  const id = parseInt(req.params?.id);
  if (!id) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid " });
  }

  try {
    const deletedTask = await prisma.task.delete({
      where: {
        id,
        userId: global.user_id,
      },
      select: { id: true, title: true, isCompleted: true },
    });

    return res.status(StatusCodes.OK).json(deletedTask);
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "That task was not found " });
    }
    return next(err);
  }
};

//////////////////////INDEX/////////////////////////////
const index = async (req, res, next) => {
  //===> Removed the filter function to findIndex ---> to search the database
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true },
    });

    if (tasks.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Not Found" });
    }

    res.status(StatusCodes.OK).json(tasks);
  } catch (err) {
    next(err);
  }
};

//////////////////////////////Update/////////////////
const update = async (req, res, next) => {
  const id = parseInt(req.params?.id); //==> Is there an id

  if (!id) {
    return res.status(400).json({ message: "The task ID passed is not valid" });
  }

  //Validates the request body
  const { error, value } = patchTaskSchema.validate(req.body);
  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: error.details[0].message });
  }

  try {
    const task = await prisma.task.update({
      data: value,
      where: {
        id,
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true },
    });

    return res.status(StatusCodes.OK).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found. " });
    } else {
      return next(err);
    }
  }
};

//////////////////SHOW///////////////////////////
const show = async (req, res, next) => {
  const id = parseInt(req.params.id);

  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Not able to show" });
  }

  try {
    const task = await prisma.task.findUnique({
      where: {
        id,
        userId: global.user_id,
      },
      select: { id: true, title: true, isCompleted: true },
    });

    if (!task) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "That task was not found" });
    }
    res.status(StatusCodes.OK).json(task);
  } catch (err) {
    next(err);
  }
};
module.exports = {
  create,
  index,
  update,
  deleteTask,
  show,
};
