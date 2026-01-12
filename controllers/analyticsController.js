const prisma = require("../db/prisma");
const { StatusCodes } = require("http-status-codes");

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
    where: { userId },
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
    by: ["createdAt"],
    where: {
      userId,
      createdAt: { gte: oneWeekAgo },
    },
    _count: { id: true },
  });

  //return response with taskStats, recentTasks, and weeklyProgress
  return res
    .status(StatusCodes.OK)
    .json({ taskStats, recentTasks, weeklyProgress });
};
