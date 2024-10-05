#!/usr/bin/env node

import fs from "fs";
import path from "path";
import express from "express";
import { program } from "commander";
import chalk from "chalk";
import cors from "cors";

const app = express();
app.use(cors());

program
  .option("--url <endpoint>", "API endpoint", "/api")
  .option(
    "--response <fileOrText>",
    "Response file or text",
    '{"response": "success"}'
  )
  .option("--port <number>", "Port number", "8080")
  .option("--status <number>", "HTTP status code", "200");

program.parse(process.argv);

const options = program.opts();

// Validate URL
if (!options.url.startsWith("/")) {
  console.error(chalk.red('Error: The API endpoint must start with "/".'));
  process.exit(1);
}

// Determine if a path is a file
function isFile(filePath) {
  return fs.existsSync(filePath) && fs.lstatSync(filePath).isFile();
}

app.all(options.url, (req, res) => {
  let responseContent = options.response;
  const statusCode = parseInt(options.status, 10) || 200;
  const responsePath = path.resolve(responseContent);

  // Check if responseContent is a path to an existing file
  if (fs.existsSync(responsePath) && isFile(responsePath)) {
    const ext = path.extname(responsePath);

    try {
      responseContent = fs.readFileSync(responsePath, "utf8");

      // Set Content-Type based on file extension
      switch (ext) {
        case ".json":
          // Try parsing JSON to ensure it's valid
          try {
            JSON.parse(responseContent);
            res.setHeader("Content-Type", "application/json");
          } catch (err) {
            console.error(
              chalk.red(`Error parsing JSON response file: ${err.message}`)
            );
            res.status(500).send("Server Error: Invalid JSON file.");
            return;
          }
          break;
        case ".txt":
          res.setHeader("Content-Type", "text/plain");
          break;
        case ".html":
          res.setHeader("Content-Type", "text/html");
          break;
        default:
          res.setHeader("Content-Type", "application/octet-stream");
          break;
      }
    } catch (err) {
      console.error(chalk.red(`Error reading response file: ${err.message}`));
      res.status(500).send("Server Error: Unable to read response file.");
      return;
    }
  } else {
    // The responseContent is not a file, treat it as content

    // Check if responseContent is valid JSON
    try {
      JSON.parse(responseContent);
      res.setHeader("Content-Type", "application/json");
    } catch (err) {
      // Not valid JSON, send as text/plain
      res.setHeader("Content-Type", "text/plain");
    }
  }

  res.status(statusCode).send(responseContent);
});

// Start the server
const server = app.listen(options.port, () => {
  console.log(
    chalk.green(
      `Mock API is running at http://localhost:${options.port}${options.url}`
    )
  );
});

// Handle server errors
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(chalk.red(`Error: Port ${options.port} is already in use.`));
  } else {
    console.error(chalk.red(`Server error: ${err.message}`));
  }
  process.exit(1);
});
