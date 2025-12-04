const { StatusCodes } = require("http-status-codes")
//handle error
const notFound = (req, res) => {
    res.status(StatusCodes.NOT_FOUND);
    res.send(`You can't do a ${req.method} for ${req.url}`)
}
module.exports = notFound;