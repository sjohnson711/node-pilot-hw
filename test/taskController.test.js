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
      body: { title: "first task" },
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
      method: "POST",
      body: { title: "first task" },
      user: { id: user1.id },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(create, req, saveRes);
    expect(saveRes.statusCode).toBe(201);
  });
  it("17. The object returned from the create call has the expected title ", async () => {
     saveData = saveRes._getJSONData();
    expect(saveData.title).toBe("first task");
  });
  it("18. isCompleted verified", () => {
    const saveData = saveRes._getJSONData();
    expect(saveData.isCompleted).toBe(false); //default value
  });
  it("19. userId no value", () => {
    const saveData = saveRes._getJSONData();

    expect(saveData.userId).toBeUndefined();

    saveTaskId = saveData.id;

   
  });
});


  //////// test getting created tasks ///////////
describe("test getting created tasks", () => {
    let newSaveRes; // We'll use this to store responses within this block
  
    it("20. You can't get a list of tasks without a user id", async () => {
      expect.assertions(1);
      const req = httpMocks.createRequest({ method: "GET" });
      newSaveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
  
      try {
        // Testing 'index' here. It should throw TypeError because req.user is missing
        await waitForRouteHandlerCompletion(index, req, newSaveRes);
      } catch (e) {
        expect(e.name).toBe("TypeError");
      }
    });
  
    it("21. If you use user1's id on index() the call returns a 200 status.", async () => {
      const req = httpMocks.createRequest({
        method: "GET",
        user: { id: user1.id } // Acting as Bob
      });
      newSaveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
      await waitForRouteHandlerCompletion(index, req, newSaveRes);
      expect(newSaveRes.statusCode).toBe(200);
    });
  
    it("22. The returned object has a tasks array of length 1.", () => {
      const data = newSaveRes._getJSONData();
      expect(data.tasks.length).toBe(1);
    });
  
    it("23. The title in the first array object is as expected.", () => {
      const data = newSaveRes._getJSONData();
      expect(data.tasks[0].title).toBe("first task");
    });
  
    it("24. The first array object does not contain a userId.", () => {
      const data = newSaveRes._getJSONData();
      // Security check: userId should be stripped from the response
      expect(data.tasks[0].userId).toBeUndefined();
    });
  
    it("25. If you get the list of tasks using the userId from user2, you get a 404.", async () => {
     
      const req = httpMocks.createRequest({
        method: "GET",
        user: { id: user2.id } 
      });
      const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      
      await waitForRouteHandlerCompletion(index, req, res);
      expect(res.statusCode).toBe(404);
    });

    it("26. You can retrieve the created task using show().", async () => {
      const req = httpMocks.createRequest({
        method: "GET",
        user: { id: user1.id },
        params: { id: saveTaskId.toString() },
      });
      const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      await waitForRouteHandlerCompletion(show, req, res);
      expect(res.statusCode).toBe(200);
    });
      it("27. User2 can't retrieve this task entry. You should get a 404.", async () => {
        const req = httpMocks.createRequest({
          method: "GET",
          user: { id: user2.id }, // Alice trying to see Bob's task
          params: { id: saveTaskId.toString() },
        });
        const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        
        await waitForRouteHandlerCompletion(show, req, res);
        expect(res.statusCode).toBe(404);
      });
      describe("testing update and delete of tasks", () => {
        it("28. User1 can set the task corresponding to saveTaskId to isCompleted: true.", async () => {
          const req = httpMocks.createRequest({
            method: "PATCH",
            user: { id: user1.id },
            params: { id: saveTaskId.toString() },
            body: { isCompleted: true }
          });
          const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
          
          await waitForRouteHandlerCompletion(update, req, res);
          expect(res.statusCode).toBe(200);
          const data = res._getJSONData();
          expect(data.isCompleted).toBe(true);
        });
      
        it("29. User2 can't do this.", async () => {
          const req = httpMocks.createRequest({
            method: "PATCH",
            user: { id: user2.id }, // Alice trying to update Bob's task
            params: { id: saveTaskId.toString() },
            body: { isCompleted: false }
          });
          const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
          
          await waitForRouteHandlerCompletion(update, req, res);
          expect(res.statusCode).toBe(404);
        });
      
        it("30. User2 can't delete this task.", async () => {
          const req = httpMocks.createRequest({
            method: "DELETE",
            user: { id: user2.id },
            params: { id: saveTaskId.toString() }
          });
          const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
          
          await waitForRouteHandlerCompletion(deleteTask, req, res);
          expect(res.statusCode).toBe(404);
        });
      
        it("31. User1 can delete this task.", async () => {
          const req = httpMocks.createRequest({
            method: "DELETE",
            user: { id: user1.id },
            params: { id: saveTaskId.toString() }
          });
          const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
          
          await waitForRouteHandlerCompletion(deleteTask, req, res);
          expect(res.statusCode).toBe(200);
        });
      
        it("32. Retrieving user1's tasks now returns a 404.", async () => {
          const req = httpMocks.createRequest({
            method: "GET",
            user: { id: user1.id }
          });
          const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
          
          await waitForRouteHandlerCompletion(index, req, res);
          expect(res.statusCode).toBe(404);
        });
      });
});
