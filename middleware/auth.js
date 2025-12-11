(req, res, next) => {
    if(global.user_id === null){
        return res.status(401).json({ message: "unauthorized"})
    }
    res.status(200).json({message: "user found"})
    next()

}