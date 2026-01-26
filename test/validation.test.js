const { userSchema } = require(".../validation/userSchema");
const { taskSchema, patchSchema } = require(".../validation/taskSchema");

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
        { email: "bob@sample.com "}
    )
    expect(
        error.details.find((detail) => detail.content.key == "email")
    ).toBeDefined()
  });
});
