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
    const {userId, ...sanitizedTask} = newTask
    res.json(sanitizedTask)
}
//if there are no params, the ? makes sure that you get a null
const taskToFind = parseInt(req.params?.id); 
if(!taskToFind){
    return res.status(400).json({ message: "The task ID passed is not valid "})
}
//we get the index, not the task, so that we can splice it
const taskIndex = global.tasks.findIndex((task) => task.id === taskToFind && task.userId === global.user_id.email);  //---> if we can find the task and user has the right email!

if(taskIndex === -1) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "That task was not found"})
    //else it's a 404 

}

const task = { userId, ...global.tasks[taskIndex]}; //make a copy without the userId
global.tasks.splice(taskIndex, 1); //do the delete
return res.json(task) //return the entry just deleted. The default status code, OK, is returned. 

