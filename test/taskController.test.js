const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");
require("dotenv").config(); // needed to get database urls
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; //points to the test database
const prisma = require("../db/prisma");
const EventEmitter = require("events");

const on = new EventEmitter();
const httpMocks = require("node-mocks-http");
const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require("../controllers/taskController");

//a few useful globals
let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
  user1 = await prisma.User.create({
    data: { name: "Bob", email: "bob@sample.com", hashedPassword: "nonsense" },
  });
  user2 = await prisma.User.create({
    data: {
      name: "Alice",
      email: "alice@sample.com",
      hashedPassword: "nonsense",
    },
  });
});

afterAll(() => {
  prisma.$disconnect();
});

describe("testing task creation", () => {
  let saveRes;
  it("14. cant create a task without a user id", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    expect.assertions(1);
    try {
      await waitForRouteHandlerCompletion(create, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });
  it("15. cannot create a task with a bogus user id", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "ghost talk" },
      user: { id: 99999 },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    expect.assertions(1);
    try {
      await waitForRouteHandlerCompletion(create, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("PrismaClientKnownRequestError");
    }
  });
  it("16. Valid user.id, success code 201", async () => {
    const req = httpMocks.createRequest({
      method: "CREATE",
      body: { title: "Welcome Home" },
      user: { id: user1.id },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(create, req, saveRes);
    expect(saveRes.statusCode).toBe(201);
  });
  it("17. The object returned from the create call has the expected title ", async () => {
    const saveData = saveRes._getJSONData();
    expect(saveData.title).toBe("Welcome Home");
  });
  it("18. isCompleted verified", () => {
    const saveData = saveRes._getJSONData();
    expect(saveData.isCompleted).toBe(false); //default value
  });
  it("19. userId no value", () => {
    const saveData = saveRes._getJSONData();
    expect(saveData.userId).toBe(true);
  });
});

////////test getting created tasks///////////
describe("test getting created tasks", () => {
  let newSaveRes;
  it("20. You can't get a list of tasks without a user id", async () => {
    expect.assertions(1);

    const req = httpMocks.createRequest({
      method: "GET",
    });
    newSaveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    try {
      await waitForRouteHandlerCompletion(totalTasks, req, res);
    } catch (e) {
      expect(e.name).toBe("TypeError");
      expect(newSaveRes.title).toBeDefined()
    }
  });
});
