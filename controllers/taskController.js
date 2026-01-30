require("dotenv").config();
const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const prisma = require("../db/prisma");

//Going to create all the request handler functions in this file such as create, index, show, update, deleteTask

/////////////////////////CREATE///////////////////////////
const create = async (req, res, next) => {
  if (!req.user.id) {
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
        userId: req.user.id,
        priority: value.priority,
      },
      select: { id: true, title: true, isCompleted: true, priority: true }, //defaults to medium priority
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
        id: id,
        userId: req.user.id,
      },

      select: { id: true, title: true, isCompleted: true, priority: true },
    });

    return res.status(StatusCodes.OK).json(deletedTask);
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "That task was not found " });
    } else {
      return next(err);
    }
  }
};

//////////////////////INDEX/////////////////////////////
const index = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const whereClause = { userId: req.user.id };

  if (req.query.find) {
    whereClause.title = {
      contains: req.query.find,
      mode: "insensitive",
    };
  }

  //Get tasks with pagination parameters
  const tasks = await prisma.task.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    skip: skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  //Get total count for pagination metaData
  const totalTasks = await prisma.task.count({
    where: whereClause,
  });

  //Build pagination object with complete metatDAta
  const pagination = {
    page,
    limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page > 1,
  };

  if (tasks.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Not Found" });
  }

  res.status(StatusCodes.OK).json({ tasks, pagination });
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
      where: {
        id: id,
        userId: req.user.id,
      },
      data: value,
      select: { title: true, isCompleted: true, id: true, priority: true },
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
        id: id,
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
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

// Bulk create with validation
const bulkCreate = async (req, res, next) => {
  const { tasks } = req.body;

  // Validate the tasks array
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  // Validate all tasks before insertion
  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || "medium",
      userId: req.user.id,
    });
  }

  // Use createMany for batch insertion
  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  create,
  index,
  update,
  deleteTask,
  show,
  bulkCreate,
};
