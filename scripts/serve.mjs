import http from "node:http";
import { readFile } from "node:fs/promises";

// Development serves editable source; presentation mode serves the built copy.
const development = process.argv.includes("--dev");
const directory = development ? "src" : "dist";
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("PORT must be an integer between 1 and 65535.");
  process.exit(1);
}

const files = {
  "/": "index.html",
  "/index.html": "index.html",
  "/app.js": "app.js",
  "/model.js": "model.js",
  "/styles.css": "styles.css",
};
const types = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
};

const server = http.createServer(async (request, response) => {
  const file = files[new URL(request.url, "http://localhost").pathname];
  if (!file) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  try {
    const data = await readFile(
      new URL(`../${directory}/${file}`, import.meta.url),
    );
    response.writeHead(200, {
      "Content-Type": types[file.split(".").pop()],
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(data);
  } catch {
    response.writeHead(503);
    response.end(
      "Build files are missing. Stop this server and run npm start.",
    );
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Your project may already be running.`,
    );
    console.error(
      `Try http://127.0.0.1:${port}, or stop the other server with Ctrl+C.`,
    );
  } else {
    console.error(`Cannot start the local server: ${error.message}`);
  }
  process.exitCode = 1;
});

server.listen(port, "127.0.0.1", () => {
  console.log("\nSecured App Payment");
  console.log(
    `Mode: ${development ? "Development (src)" : "Presentation (dist)"}`,
  );
  console.log(`Local: http://127.0.0.1:${port}`);
  console.log('Choose "Open demo workspace" in the browser.');
  console.log(
    development
      ? "Save source changes, then refresh the browser."
      : "The website runs locally without an internet connection.",
  );
  console.log("Keep this terminal open. Press Ctrl+C to stop.\n");
});
