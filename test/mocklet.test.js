import { exec } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import { expect } from "chai";
import request from "supertest";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockletPath = path.resolve(__dirname, "../index.js");

describe("Mocklet CLI Tool", function () {
  this.timeout(10000); // Increase timeout for server startup

  let serverProcess;
  const testPort = 3000;
  const testUrl = "/api/test";

  afterEach((done) => {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
    done();
  });

  it("should start server with default settings and return default response", (done) => {
    serverProcess = exec(`node ${mockletPath}`);

    serverProcess.stdout.on("data", (data) => {
      if (data.includes("Mock API is running")) {
        request("http://localhost:8080")
          .get("/api")
          .expect("Content-Type", /json/)
          .expect(200, { response: "success" }, done);
      }
    });
  });

  it("should start server with custom endpoint and JSON response file", (done) => {
    const responseData = { message: "This is a test response" };
    fs.writeFileSync("example.json", JSON.stringify(responseData));

    serverProcess = exec(
      `node ${mockletPath} --url "${testUrl}" --response "example.json" --port ${testPort}`
    );

    serverProcess.stdout.on("data", (data) => {
      if (data.includes("Mock API is running")) {
        request(`http://localhost:${testPort}`)
          .get(testUrl)
          .expect("Content-Type", /json/)
          .expect(200, responseData, (err) => {
            fs.unlinkSync("example.json");
            done(err);
          });
      }
    });
  });

  it("should return the content of a text file when response file is a .txt file", (done) => {
    const responseText = "This is a text file response.";
    fs.writeFileSync("example.txt", responseText);

    serverProcess = exec(
      `node ${mockletPath} --url "${testUrl}" --response "example.txt" --port ${testPort}`
    );

    serverProcess.stdout.on("data", (data) => {
      if (data.includes("Mock API is running")) {
        request(`http://localhost:${testPort}`)
          .get(testUrl)
          .expect("Content-Type", /text\/plain/)
          .expect(200, responseText, (err) => {
            fs.unlinkSync("example.txt");
            done(err);
          });
      }
    });
  });

  it("should return error when JSON response file contains invalid JSON", (done) => {
    fs.writeFileSync("invalid.json", "{ invalid json ");

    serverProcess = exec(
      `node ${mockletPath} --url "${testUrl}" --response "invalid.json" --port ${testPort}`
    );

    serverProcess.stdout.on("data", (data) => {
      if (data.includes("Mock API is running")) {
        request(`http://localhost:${testPort}`)
          .get(testUrl)
          .expect(500)
          .expect("Server Error: Invalid JSON file.", (err) => {
            fs.unlinkSync("invalid.json");
            done(err);
          });
      }
    });
  });

  it('should return error when endpoint does not start with "/"', (done) => {
    serverProcess = exec(
      `node ${mockletPath} --url "api/test" --response "example.json" --port ${testPort}`
    );

    let output = "";

    serverProcess.stderr.on("data", (data) => {
      output += data;
    });

    serverProcess.on("exit", (code) => {
      expect(code).to.not.equal(0);
      expect(output).to.include('Error: The API endpoint must start with "/".');
      done();
    });
  });

  it("should handle port already in use", (done) => {
    // Start a server on the test port
    const busyServer = exec(`node ${mockletPath} --port ${testPort}`);

    busyServer.stdout.on("data", (data) => {
      if (data.includes("Mock API is running")) {
        // Try to start another server on the same port
        serverProcess = exec(`node ${mockletPath} --port ${testPort}`);

        serverProcess.stderr.on("data", (data) => {
          if (data.includes(`Error: Port ${testPort} is already in use.`)) {
            expect(data).to.include(
              `Error: Port ${testPort} is already in use.`
            );
            busyServer.kill();
            done();
          }
        });
      }
    });
  });

  it("should return custom status code", (done) => {
    const responseData = { error: "Not Found" };
    serverProcess = exec(
      `node ${mockletPath} --url "${testUrl}" --response '${JSON.stringify(
        responseData
      )}' --status 404 --port ${testPort}`
    );

    serverProcess.stdout.on("data", (data) => {
      if (data.includes("Mock API is running")) {
        request(`http://localhost:${testPort}`)
          .get(testUrl)
          .expect("Content-Type", /json/)
          .expect(404, responseData, done);
      }
    });
  });

  it("should return plain text when response is not valid JSON", (done) => {
    const responseText = "Plain text response";
    serverProcess = exec(
      `node ${mockletPath} --url "${testUrl}" --response "${responseText}" --port ${testPort}`
    );

    serverProcess.stdout.on("data", (data) => {
      if (data.includes("Mock API is running")) {
        request(`http://localhost:${testPort}`)
          .get(testUrl)
          .expect("Content-Type", /text\/plain/)
          .expect(200, responseText, done);
      }
    });
  });
});
