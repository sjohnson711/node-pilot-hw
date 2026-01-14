const prisma = require("../db/prisma");
const { StatusCodes } = require("http-status-codes");

exports.getAllUserAnalytics = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  //userTask counts
  const usersRaw = await prisma.user.findMany({
    include: {
      Task: {
        where: { isCompleted: false },
        select: { id: true },
        take: 5,
      },
      _count: {
        select: {
          Task: true,
        },
      },
    },
    skip: skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  //Transform the result to clean up the structure
  const users = usersRaw.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    _count: user._count, //Includes ( Task )
    Task: user.Task, //Includes array of task IDs
  }));

  //Get total count for pagination
  const totalUsers = await prisma.user.count();

  const totalPages = Math.ceil(totalUsers/limit)

  const pagination = {
    page,
    limit,
    total: totalUsers,
    pages: totalPages,
    hasNext: page  < totalPages,
    hasPrev: page > 1,
  };
  return res.status(StatusCodes.OK).json({ users, pagination });
};

exports.getUserAnalytics = async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid Id format" });
  }

  //Check if user exist
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "User Not Found" });
  }

  //Use groupBy to count tasks by completion status
  const taskStats = await prisma.task.groupBy({
    by: ["isCompleted"],
    where: { userId },
    _count: {
      id: true,
    },
  });

  //Include recent task activity with eager loading
  const recentTasks = await prisma.task.findMany({
    where: { userId }, //only look for rows that belong to the user
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      userId: true,
      User: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  //Calculate weekly progress using groupBy
  //first, calculate the date from one week ago
  //hint, Use new Date() and setDate() - 7

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  //use groupBy with a where clause filtering by createdAt>= oneWeekAgo
  const weeklyProgress = await prisma.task.groupBy({
    by: ["createdAt"], //stacking the tasks into piles based on the day they were created.
    where: {
      userId,//
      createdAt: { gte: oneWeekAgo },//filtering the task from the last 7 days.
    },
    _count: { id: true }, //how many are in each pile.
  });

  //return response with taskStats, recentTasks, and weeklyProgress
  return res
    .status(StatusCodes.OK)
    .json({ taskStats, recentTasks, weeklyProgress });
};



