# Node.js Fundamentals

## What is Node.js?
is a Javascript runtime that uses javascript outside of the browser

## How does Node.js differ from running JavaScript in the browser?
JavaScript in the browswer uses the DOM and WEB API, Node.js I am able to start a process, start a server, and access the file system

## What is the V8 engine, and how does Node use it?
Is a JavaScript engine that allows javascript to run in the browser along with other API's

## What are some key use cases for Node.js?
You can start a process, start a server, and access the file system

## Explain the difference between CommonJS and ES Modules. Give a code example of each.
//commonJS => const fs = require('fs') && module.exports = function
//ES modules => import App from './App.js'

**CommonJS (default in Node.js):**
```js
const fs = require('fs');
```

**ES Modules (supported in modern Node.js):**
```js
import { function } from './Function'
``` 