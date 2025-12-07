const { StatusCodes } = require("http-status-codes");

const register = (req, res) => {
  const newUser = { ...req.body }; // this makes a copy
  global.users.push(newUser);
  global.user_id = newUser; // After the registration step, the user is set to logged on.
  delete req.body.password;
  res.status(201).json(req.body);
};

const userLogon = (req, res) => {
  const { email, password } = req.body;

  const userFound = global.users.find((user) => user.email === email);

  //find use by email
  if (!userFound) {
    return res.status(401).json({ message: "Authentication Failed" });
  }
  //if password matches
  if (userFound.passoword !== password) {
    return res.status(401).json({ message: "Authentication Failed" });
  }
  global.user_id = userFound; //based off the password and the email matching

  return res.status(200).json({ name: userFound.name, email: userFound.email });
};

const userLogoff = (req, res) => {
  global.user_id = null;
  res.sendStatus().json({ message: "logged off" });
};

module.exports = { register, userLogon, userLogoff };

//The module is user for logon, logoff and other controllables
