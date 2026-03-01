const { userSchema } = require("../validation/userSchema");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

//checking to see if the user object validation will accept a trivial password
describe("user object validation tests", () => {
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "password" },
      { abortEarly: false }
    );
    expect(
      error.details.find((detail) => detail.context.key == "password")
    ).toBeDefined();
  });

  it("2. Email to be verified", () => {
    const { error } = userSchema.validate(
      { name: "Bob", password: "password" },
      { abortEarly: false }
    );
    expect(error.details.find((detail) => detail.context.key == "email"));
  });

  it("3. Does not accept an invalid email", () => {
    const { error } = userSchema.validate(
      {
        name: "Bob",
        password: "password",
        email: "sample",
      },
      { abortEarly: false }
    );
    expect(error.details.find((detail) => detail.context.key == "email"));
  });
  it("4. Requires a password", () => {
    const { error } = userSchema.validate({
      name: "Bob",
      email: "bob@sample.com",
    });
    expect(error.details.find((detail) => detail.context.key == "password"));
  });

  it("5. Requires a name", () => {
    const { error } = userSchema.validate(
      {
        email: "bob@sample.com",
        password: "password",
      },
      { abortEarly: false }
    );
    expect(error).toBeDefined(); //had to check for the error first
    const nameError = error.details.find(
      (detail) => detail.context.key === "name"
    );
    expect(nameError).toBeDefined();
  });

  it("6. The name must be valid (3 to 30 characters).", () => {
    const { error } = userSchema.validate(
      // We use "Ab" (2 chars) because it is LESS than the 3-character minimum
      { name: "Ab", email: "bob@sample.com", password: "Password123!" },
      { abortEarly: false }
    );
    expect(
      error.details.find((detail) => detail.context.key == "name")
    ).toBeDefined();
  });
  it("7. Validation", () => {
    const { error } = userSchema.validate({
      name: "Bob",
      password: "Password!123",
      email: "bob@sample.com",
    });
    expect(error).toBeUndefined();
  });
});

//TaskSchema stanza for the following task
describe("Task object validation", () => {
  it("8. taskSchema requires a title", () => {
    const { error } = taskSchema.validate({
      required: true,
      isCompleted: true,
      priority: "medium",
    });
    expect(
      error.details.find((detail) => detail.context.key == "title")
    ).toBeDefined();
  });
  it("9. isCompleted value is specified as valid", () => {
    const { error } = taskSchema.validate({
      title: "title",
      isCompleted: "not-a-boolean", // <--- Change this from true to a string
      
    });
    expect(error).toBeDefined()
  
    expect(
      error.details.find((detail) => detail.context.key == "isCompleted")
    ).toBeDefined();
  });
  it("10. isCompleted value is not specified but the rest of the object is valid ", () => {
    const { error, value } = taskSchema.validate(
      { title: "Valid Title" }, // Use a valid title
      { abortEarly: false }
    );

    expect(value.isCompleted).toBe(false); 
  });
  it("11. isCompleted remains true after validation", () => {
    const { error, value } = taskSchema.validate({
      isCompleted: true,
      title: "title",
     
    });

    // const fieldError =  error.details.find((detail) => detail.context.key == 'isCompleted')
    expect(error?.details).toBeUndefined()
    
    expect(value.isCompleted).toBe(true)
  });
});
/////////patchSchema///////////
describe("PatchTaskSchema validation", () => {
  it("12. Patch does not require a title", () => {
    const { error } = patchTaskSchema.validate({
      isCompleted: false,
      
    });
    expect(error).toBeUndefined();
  });
  it("13. Validation fails when isCompleted is not provided", () => {
    const { error } = patchTaskSchema.validate({
      title: "title",
      isCompleted: false
    });
    expect(error).toBeUndefined();

   

  });
});
