import express, { Request, Response } from "express";
import { Worker } from "node:worker_threads";
import { join } from "path";
// create Express app instance
const app = express();

// set up a basic GET route
app.get("/", (req: Request, res: Response) => {
  // using our existing thread pool
  // most of tha native nodejs functions are already using libuv and their own threadpool
  // they dont work on our event loop

  // worker.js when running on production from dist folder
  // else worker.ts

  const filePath = join(__dirname, "worker.ts");
  //   const filePath = join(__dirname, "src", "worker.ts");
  const worker = new Worker(filePath);

  // function is equal to thread itself
  worker.on("message", function (message) {
    // whenever worker sends message back to application
    // this function will be called
    // use keyword function because
    console.log(message);
    res.json(`Hello World! ${message}`);
  });
  // area inside worker file will be invoked when u invoke postMessage
  // postMessage thread will execute the function in worker.ts inside the worker
  worker.postMessage("start!");
});

app.get("/fast", (req, res) => {
  res.send("This was fast!");
});

// start the app
app.listen(3000, () => {
  console.log("Express app listening on port 3000!");
});

/**
 * For clustering start multiple nodejs processes
 * use pm2 clustering
 * -i let pm2 decide the number of instances for our application
 * pm2 start dist index.js -i 0
 * 0 means pm2 idk what to do decide it for me
 * pm2 will setup instances = no of logical CPU cores on your computer
 * e.g 2 physical cores and if each core can process 2 threads at the same time
 * so 2 threads at the same time 2 times 2 cores is equal to 4 logical cores
 * pm2 delete index
 * pm2 list
 * pm2 show
 * pm2 show index
 * pm2 monit
 * pm2 delete index
 * pm2 kill
 *
 * ab -c 1 -n 1 localhost:3000/
 * two at the same time
 * ab -c 2 -n 2 localhost:3000/
 */
