const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../App");
const paymentService = require("../services/paymentService");

const request = (server, path, method = "GET") =>
  new Promise((resolve, reject) => {
    const req = http.request(
      { port: server.address().port, path, method },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () =>
          resolve({ status: res.statusCode, body: JSON.parse(body) }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });

test("health endpoint is available without a database", async () => {
  const server = app.listen(0);
  const response = await request(server, "/api/health");
  server.close();
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test("unknown routes return the standard error envelope", async () => {
  const server = app.listen(0);
  const response = await request(server, "/api/does-not-exist");
  server.close();
  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, "ROUTE_NOT_FOUND");
});

test("Kora payment statuses are normalized safely", () => {
  assert.equal(paymentService.isSuccessful({ status: "success" }), true);
  assert.equal(paymentService.isSuccessful({ status: "successful" }), true);
  assert.equal(paymentService.isPending({ status: "pending" }), true);
  assert.equal(paymentService.isPending({ status: "processing" }), true);
  assert.equal(paymentService.isFailed({ status: "failed" }), true);
  assert.equal(paymentService.isFailed({ status: "abandoned" }), true);
});
