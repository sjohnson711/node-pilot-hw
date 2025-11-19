const os = require("os");
const path = require("path");
const fs = require("fs");

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}
const filePath = path.join(sampleFilesDir, "demo.txt");

// OS module
console.log(`Platform: ${os.platform()}`);
console.log(`CPU: ${os.cpus()[0].model}`);
console.log(`Total Memory: ${os.totalmem()} `);

// Path module
console.log(
  `Joined path: ${path.join(__dirname, "sample-files", "sample.txt")}`
);

// fs.promises API
async function fsPromises() {
  try {
    await fs.promises.writeFile(filePath, "Hello from fs.promises!");
    const content = await fs.promises.readFile(filePath, "utf8");
    console.log(`fs.promises read: ${content}`);
  } catch (error) {
    console.error(error);
  }
}

fsPromises();

// Streams for large files- log first 40 chars of each chunk
fs.writeFile(
  path.join(__dirname, "/sample-files", "largefile.txt"),
  "",
  (err) => {
    if (err) throw err;
    console.log(`File Created...`);
    fs.appendFile(
      path.join(__dirname, "/sample-files", "largefile.txt"),
      " Seth is real",
      (err) => {
        if (err) {
          console.log(`File Created...`);
        }
      }
    );
  }
);

let content = "";
for (let i = 0; i < 100; i++) {
  content += `Read chunk: I created random lines of code ${i}\n`;
}

let largetext = path.join(__dirname, "largefile.txt");

async function writeToFile() {
  try {
    await fs.promises.writeFile(largetext, content, "utf8");
    console.log("wrote to file");
  } catch (err) {
    console.error(`there is an error in your code`, err);
  }
}
writeToFile();

const readFile = fs.createReadStream(largetext, { highWaterMark: 1024 });

readFile.on("data", (chunk) => {
  console.log(`Read chunk:${chunk}`);
});

readFile.on("end", () =>
  console.log("Finished reading large file with streams")
);





//example for video
// const fs = require('fs')


// modules.export = myFunction();