require("dotenv").config();
const { StatusCodes } = require("http-status-codes");
const crypto = require("crypto");
const util = require("util");
const prisma = require("../db/prisma");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

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

  //create the JWT and sit it in a cookie and return the result to the caller
  const cookieFlags = (req) => {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", //only when HTTPS is available
      sameSite: "Strict",
    };
  };

  const setJwtCookie = (req, res, user) => {
    //sign JWT
    const payload = { id: user.id, csrfToken: randomUUID() };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    }); //1 hour expiration
    // set cookie. Note that the cookie flags have to be different in production and in test
    res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); //1hr experation
    return payload.csrfToken; //thhis is needed in the body returned by logon() and register()
  };

  const { name, email, password } = value;
  const hashedPassword = await hashPassword(password);
  delete value.password;

  try {
    const result = await prisma.$transaction(async (tx) => {
      //create user account

      const newUser = await tx.user.create({
        data: { name, email, hashedPassword },
        select: { id: true, email: true, name: true },
      });
      //create 3 welcome tasks using createMany
      const welcomeTaskData = [
        {
          title: "Complete your profile",
          userId: newUser.id,
          priority: "medium",
        },
        { title: "Add your first task", userId: newUser.id, priority: "high" },
        { title: "Explore the app", userId: newUser.id, priority: "low" },
      ];
      await tx.task.createMany({ data: welcomeTaskData });

      //Fetch the created tasks to return them
      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: { in: welcomeTaskData.map((t) => t.title) },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      });
      const csrfToken = setJwtCookie(req, res, newUser);
      return { user: newUser, welcomeTasks, csrfToken };
    });

    res.status(201);
    res.json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
      csrfToken: result.csrfToken,
    });
    return;
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ message: "Email already registered" });
    } else {
      return next(err);
    }
  }
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

  //create the JWT and sit it in a cookie and return the result to the caller

  const setJwtCookie = (req, res, user) => {
    //sign JWT
    const payload = { id: user.id, csrfToken: randomUUID() };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    }); //1 hour expiration
    // set cookie. Note that the cookie flags have to be different in production and in test
    res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); //1hr experation
    return payload.csrfToken; //thhis is needed in the body returned by logon() and register()
  };
  const csrfToken = setJwtCookie(req, res, user);
  return res.status(StatusCodes.OK).json({
    user: {
      name: user.name,
      email: user.email,
    },
    csrfToken: csrfToken,
  });
};
const cookieFlags = (req) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", //only when HTTPS is available
    sameSite: "Strict",
  };
};

// LOGOFF
const logoff = (req, res) => {
  res.clearCookie("jwt", cookieFlags(req));
  return res.status(200).json({ message: "logged off" });
};

module.exports = { register, logon, logoff };
