const { StatusCodes } = require("http-status-codes");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const pool = require("../db/pg-pool");
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

//REGISTER
const register = async (req, res, next) => {
  if (!req.body) req.body = {};

  const { value, error } = userSchema.validate(req.body, { abortEarly: false }); //validates the userSchema

  if (error) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: error.details[0].message });
  }

  const { name, email, password } = value;

  const hashedPassword = await hashPassword(password);

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, hashed_password)
      VALUES($1, $2, $3)
      RETURNING id, name, email`,
      [name, email, hashedPassword]
    );

    global.user_id = result.rows[0].id; // After the registration step, the user is set to logged on.

    return res.status(StatusCodes.CREATED).json(result.rows[0]);
  } catch (e) {
    if (e.code === "23505") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "User already exists " });
    }
    return next(e);
  }
};

//LOGON
const logon = async (req, res) => {
  if (!req.body || !req.body.email || !req.body.password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Email and password are required" });
  }

  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (result.rows.length === 0) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  }

  const user = result.rows[0];

  const isPasswordValid = await comparePassword(password, user.hashed_password);

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
///////////LOGOFF///////////////////////
const logoff = (req, res) => {
  global.user_id = null;
  return res.status(200).json({ message: "logged off" });
};

module.exports = { register, logon, logoff };

//The module is user for logon, logoff and other controllables
