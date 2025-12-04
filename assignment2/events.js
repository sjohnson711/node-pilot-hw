const EventEmitter = require("events");

const emitter = new EventEmitter();

//creating emitter for the following event --> time
emitter.on("time", (currentTime) => {
  console.log("Time received: ", currentTime);
});

//emit within the setInterval to update the time every 5 seconds
const time = new Date();
let localtime = setInterval(() => {
  emitter.emit("time", time.toLocaleTimeString());
}, 5000);

clearInterval(localtime);

module.exports = emitter;
