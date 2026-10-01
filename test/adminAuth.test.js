const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../model/user");
const userController = require("../controller/userController");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const responseRecorder = () => {
  const response = {
    statusCode: null,
    body: null,
    headers: {},
    status(code) {
      response.statusCode = code;
      return response;
    },
    json(body) {
      response.body = body;
      return response;
    },
    setHeader(name, value) {
      response.headers[name.toLowerCase()] = value;
      return response;
    },
  };
  return response;
};

const signupRequest = (secret) => ({
  body: {
    fullName: "Academy Admin",
    email: "ADMIN@EXAMPLE.COM",
    password: "a-strong-password-123",
  },
  get: (header) => (header === "x-admin-bootstrap-secret" ? secret : undefined),
});

test("admin bootstrap is unavailable when its server secret is unset", async (t) => {
  const previous = process.env.ADMIN_BOOTSTRAP_SECRET;
  delete process.env.ADMIN_BOOTSTRAP_SECRET;
  t.after(() => {
    if (previous === undefined) delete process.env.ADMIN_BOOTSTRAP_SECRET;
    else process.env.ADMIN_BOOTSTRAP_SECRET = previous;
  });
  const response = responseRecorder();
  await userController.adminSignUp(signupRequest("anything"), response);
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.error.code, "ADMIN_BOOTSTRAP_UNAVAILABLE");
});

test("admin bootstrap rejects an invalid secret before querying users", async (t) => {
  const previous = process.env.ADMIN_BOOTSTRAP_SECRET;
  process.env.ADMIN_BOOTSTRAP_SECRET = "configured-secret";
  t.after(() => {
    if (previous === undefined) delete process.env.ADMIN_BOOTSTRAP_SECRET;
    else process.env.ADMIN_BOOTSTRAP_SECRET = previous;
  });
  t.mock.method(User, "exists", () => {
    throw new Error("user lookup must not run");
  });
  const response = responseRecorder();
  await userController.adminSignUp(signupRequest("incorrect"), response);
  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error.code, "ADMIN_BOOTSTRAP_INVALID");
});

test("admin bootstrap creates a verified admin once and never returns a token", async (t) => {
  const previous = process.env.ADMIN_BOOTSTRAP_SECRET;
  process.env.ADMIN_BOOTSTRAP_SECRET = "configured-secret";
  t.after(() => {
    if (previous === undefined) delete process.env.ADMIN_BOOTSTRAP_SECRET;
    else process.env.ADMIN_BOOTSTRAP_SECRET = previous;
  });
  let lookups = 0;
  let created;
  t.mock.method(User, "exists", async () => {
    lookups += 1;
    return null;
  });
  t.mock.method(User, "create", async (data) => {
    created = data;
    return { ...data, _id: "admin-1" };
  });
  const response = responseRecorder();
  await userController.adminSignUp(
    signupRequest("configured-secret"),
    response,
  );
  assert.equal(response.statusCode, 201);
  assert.equal(lookups, 2);
  assert.equal(created.role, "admin");
  assert.equal(created.isVerified, true);
  assert.notEqual(created.password, "a-strong-password-123");
  assert.equal(response.body.data.user.role, "admin");
  assert.equal("token" in response.body.data, false);
});

test("admin login returns the admin JWT in the Authorization header", async (t) => {
  const password = "a-strong-password-123";
  let query;
  const user = {
    _id: "admin-1",
    email: "admin@example.com",
    fullName: "Academy Admin",
    role: "admin",
    password: await bcrypt.hash(password, 4),
    isActive: true,
    isSuspended: false,
    isVerified: true,
    save: async () => {},
  };
  t.mock.method(User, "findOne", (filter) => {
    query = filter;
    return { select: async () => user };
  });
  const response = responseRecorder();
  await userController.adminLogin(
    { body: { email: " ADMIN@example.com ", password } },
    response,
  );
  assert.deepEqual(query, { email: "admin@example.com", role: "admin" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.user.role, "admin");
  assert.equal("token" in response.body.data, false);
  assert.match(response.headers.authorization, /^Bearer /);
  assert.equal(
    jwt.verify(response.headers.authorization.slice(7), process.env.JWT_SECRET)
      .role,
    "admin",
  );
});

test("admin login rejects non-admin credentials", async (t) => {
  let query;
  t.mock.method(User, "findOne", (filter) => {
    query = filter;
    return { select: async () => null };
  });
  const response = responseRecorder();
  await userController.adminLogin(
    { body: { email: "student@example.com", password: "password" } },
    response,
  );
  assert.deepEqual(query, { email: "student@example.com", role: "admin" });
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error.code, "ADMIN_LOGIN_INVALID");
});
