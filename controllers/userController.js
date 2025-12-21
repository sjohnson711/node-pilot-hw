const { StatusCodes } = require("http-status-codes");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

const register = async (req, res) => {
  if (!req.body) req.body = {};

  const { value, error } = userSchema.validate(req.body); //validates the userSchema

  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: error.details[0].message });
  }

  const { name, email, password } = value;

  const existingUser = global.users.find((user) => user.email === email);
  if(existingUser){
    return res  
      .status(400)
      .json({ message: "User Already Exist "})
  };

  const hashedPassword = await hashPassword(password);
  const newUser = { name, email, hashedPassword }; // this makes a copy

  global.users.push(newUser);
  global.user_id = newUser; // After the registration step, the user is set to logged on.

  res.status(StatusCodes.CREATED).json({ name, email });
};

const logon = async (req, res) => {
  if (!req.body || !req.body.email || !req.body.password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Email and password are required" });
  }

  const { email, password } = req.body;

  //find by email first
  const userFound = global.users.find((user) => user.email === email);

  //if the user is not found or the password does not match --> send UNAUTHORIZED status Code
  if (!userFound) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  }

  const match = await comparePassword(password, userFound.hashedPassword);

  if (!match) {
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
