const { StatusCodes } = require('http-status-codes' )

///this is checked before going through the logon
module.exports = (req, res, next) => {
    if(global.user_id === null){
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: "unauthorized"})
    }
    
    next()

} 