const Joi = require("joi");

const taskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).required(),
  isCompleted: Joi.boolean().default(false).not(null),
});

const patchTaskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).not(null),
  isCompleted: Joi.boolean().not(null),
})
  .min(1)
  .message("No attributes to change were specified.");

const { error, value } = userSchema.validate(
  {
    name: "Bob",
    email: "nonsense",
    password: "password",
    favoriteColor: "blue",
  },
  { abortEarly: false }
);
module.exports = { taskSchema, patchTaskSchema };
