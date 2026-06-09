const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const clientRoot = path.resolve(__dirname, "..");
const serverRoot = path.resolve(clientRoot, "..", "server");
const reactScripts = require.resolve("react-scripts/bin/react-scripts.js");
let serverProcess = null;
let clientProcess = null;

const isServerRunning = () =>
  new Promise((resolve) => {
    const request = http.get("http://localhost:5000/api/health", (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });

    request.setTimeout(1200, () => {
      request.destroy();
      resolve(false);
    });
    request.on("error", () => resolve(false));
  });

const waitForServer = async () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await isServerRunning()) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
};

const stopProcesses = () => {
  if (clientProcess && !clientProcess.killed) clientProcess.kill();
  if (serverProcess && !serverProcess.killed) serverProcess.kill();
};

const start = async () => {
  if (!(await isServerRunning())) {
    console.log("Starting portfolio API on http://localhost:5000...");
    serverProcess = spawn(process.execPath, ["server.js"], {
      cwd: serverRoot,
      env: process.env,
      stdio: "inherit",
    });

    serverProcess.on("exit", (code) => {
      if (code && code !== 0) {
        console.error(`Portfolio API stopped with exit code ${code}.`);
      }
    });

    if (!(await waitForServer())) {
      console.error("Portfolio API did not start on port 5000.");
      stopProcesses();
      process.exit(1);
    }
  } else {
    console.log("Using the portfolio API already running on port 5000.");
  }

  clientProcess = spawn(process.execPath, [reactScripts, "start"], {
    cwd: clientRoot,
    env: process.env,
    stdio: "inherit",
  });

  clientProcess.on("exit", (code) => {
    if (serverProcess && !serverProcess.killed) serverProcess.kill();
    process.exit(code || 0);
  });
};

process.on("SIGINT", () => {
  stopProcesses();
  process.exit(0);
});
process.on("SIGTERM", () => {
  stopProcesses();
  process.exit(0);
});

start();
