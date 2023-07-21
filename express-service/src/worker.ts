import { parentPort } from "node:worker_threads";

// Workers (threads) are useful for performing CPU-intensive JavaScript operations

parentPort?.on("message", () => {
  // area invoked when u invoke postMessage
  // usually used to do computationally expensive work
  let counter = 0;
  while (counter < 1e9) {
    counter++;
  }

  // back to our running application through postMessage
  parentPort?.postMessage(counter);
});
