const { StatusCodes } = require("http-status-codes");

const register = (req, res) => {
  const newUser = { ...req.body }; // this makes a copy
  global.users.push(newUser);
  global.user_id = newUser; // After the registration step, the user is set to logged on.
  delete req.body.password;
  res.status(201).json(req.body);
};

const logon = (req, res) => {
  const { email, password } = req.body;

  //find by email first
  const userFound = global.users.find((user) => user.email === email);

  //if the user is not found or the password does not match --> send UNAUTHORIZED status Code
  if (!userFound || userFound.password !== password) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  }

  global.user_id = userFound; //based off the password and the email matching

  return res
    .status(StatusCodes.OK)
    .json({ name: userFound.name, email: userFound.email });
};

const logoff = (req, res) => {
  global.user_id = null;
  return res.sendStatus(200).json({ message: "logged off" });
};

module.exports = { register, logon, logoff };

//The module is user for logon, logoff and other controllables
