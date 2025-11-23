const htmlString = `
<!DOCTYPE html>
<html>
<body>
<h1>Clock</h1>
<button id="getTimeBtn">Get the Time</button>
<p id="time"></p>
<script>
document.getElementById('getTimeBtn').addEventListener('click', async () => {
    const res = await fetch('/time');
    const timeObj = await res.json();
    console.log(timeObj);
    const timeP = document.getElementById('time');
    timeP.textContent = timeObj.time;
});
</script>
</body>
</html>
`;


const http = require("http");

const server = http.createServer({ keepAliveTimeout: 60000 }, (req, res) => {
  if (
    req.method === "POST" &&
    req.url === "/" &&
    req.headers["content-type"] === "application/json"
  ) {
    let body = ""; //declaring the body as an empty string
    req.on("data", (chunk) => (body += chunk)); //chunking the data to build the body into the string
    req.on("end", () => {
      const parseBody = JSON.parse(body); //serializing the body so that I am able to to work with the data
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ weReceived: parseBody }));
    });
  } else if (req.method === "GET" && req.url === '/time' ) {
    res.writeHead(200, { "Content-Type": "application/json "});
    res.end(JSON.stringify({ time: new Date().toLocaleTimeString() }));
  } else if (req.url === "/timePage") {
    res.writeHead(200, { "Content-Type": "text/html; ; charset=utf-8 " });
    res.end(htmlString);
  } else {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ pathEntered: req.url }));
  }
});

server.listen(8000);
