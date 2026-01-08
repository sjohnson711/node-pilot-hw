require("dotenv").config();
const { StatusCodes } = require("http-status-codes");
const crypto = require("crypto");
const util = require("util");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
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

// REGISTER
const register = async (req, res, next) => {
  if (!req.body) req.body = {};

  const { value, error } = userSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: error.details[0].message });
  }

  const { name, email, password } = value;
  const hashedPassword = await hashPassword(password);

  let user = null;

  try {
    user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword: hashedPassword, // Matches schema camelCase
      },
      select: { name: true, email: true, id: true },
    });
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "User already exists " });
    } else {
      return next(err);
    }
  }

  global.user_id = user.id;
  return res.status(StatusCodes.CREATED).json(user);
};

// LOGON
const logon = async (req, res) => {
  if (!req.body || !req.body.email || !req.body.password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Email and password are required" });
  }

  let { email, password } = req.body;
  email = email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  }

  const isPasswordValid = await comparePassword(password, user.hashedPassword);

  if (!isPasswordValid) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  }

  global.user_id = user.id;

  return res.status(StatusCodes.OK).json({
    name: user.name,
    email: user.email,
  });
};

// LOGOFF
const logoff = (req, res) => {
  global.user_id = null;
  return res.status(200).json({ message: "logged off" });
};

module.exports = { register, logon, logoff };
