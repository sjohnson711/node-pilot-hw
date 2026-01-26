const { userSchema } = require("../validation/userSchema");
const { taskSchema, patchSchema } = require("../validation/taskSchema");

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
    expect(
      error.details.find((detail) => detail.context.key == "email")
    ).toBeDefined();
  });


  it("3. Does not accept an invalid email", () => {
    const { error } = userSchema.validate({
      name: "Bob",
      password: "password",
      email: "sample"
    }, { abortEarly: false });
    expect(
      error.details.find((detail) => detail.context.key == 'email'),
    ).toBeDefined();


  });
  it("4. Requires a password", () => {
    const { error } = userSchema.validate({
      name: "Bob", email: "bob@sample.com"
    });
    expect(error.details.find((detail) => detail.context.key == "password"));
  });


  it(" 5. Requires a name", () => {
    const { error } = userSchema.validate({  email: "bob@sample.com", required: true, password: "password" });
    expect(error.details.find((detail) => detail.context.key == "name"))
      .toBeDefined();
  });
  it(" 6. Requires for the name to be 3 to 30 characters", () => {
    const { error } = userSchema.validate(
      { name: 'Al', email: "bob@sample.com", password: "password"}
    )
    expect(
      error.details.find((detail) => detail.context.key == "name")
    )
  })
  it(" 7. Validation ", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "password@1L"},
      { abortEarly: false}
    )
    return error
  })
});
