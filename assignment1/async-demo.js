const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "sample-files", "sample.txt");
// Write a sample file for demonstration
const sampleFilePath = path.join(__dirname, "sample-files", "sample.txt");

// Create sample.txt if it doesn't exist
if (!fs.existsSync(sampleFilePath)) {
  fs.writeFileSync(sampleFilePath, "Hello, async world!");
}
// 1. Callback style
fs.readFile(filePath, (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log("Callback read: ", data.toString("utf8"));
});
// Callback hell example (test and leave it in comments):

// 2. Promise style
fs.promises
  .readFile(filePath, "utf8")
  .then((data) => {
    console.log(`Promise read: ${data}`);
  })
  .catch((err) => {
    console.log(err);
  });

// 3. Async/Await style
async function getData() {
  try {
    const data = await fs.promises.readFile(filePath, "utf8");

    console.log(`Async/Await ${data}`);
  } catch (error) {
    console.error("error", error);
  }
}
getData();
