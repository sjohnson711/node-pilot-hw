const prisma = require("../db/prisma");
const { StatusCodes } = require("http-status-codes");

const userId = parseInt(req.params.id);

if (isNAN(userId)) {
  return res
    .status(StatusCodes.BAD_REQUEST)
    .json({ message: "Invalid Id format" });
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
  orderBy: { createdAt: 'desc'},
  take: 10
});
