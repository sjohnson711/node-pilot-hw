//Going to create all the request handler functions in this file such as create, index, show, update, deleteTask
const taskCounter = (() => {
    let lastTaskNumber = 0;
    return () => {
        lastTaskNumber += 1;
        return lastTaskNumber
    }
})();


const create = (req, res) => {
    const newTask = {...req.body, id: taskCounter(), userId: global.user_id.email};
    global.tasks.push(newTask);
    const [userId, ...sanitizedTask] = newTask
    res.json(sanitizedTask)
}