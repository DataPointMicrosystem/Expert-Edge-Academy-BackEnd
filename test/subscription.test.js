const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const Subscription = require("../model/subscription");
const SubscriptionPlan = require("../model/subscriptionPlan");
const Enrollment = require("../model/enrollment");
const Course = require("../model/course");
const subscriptionController = require("../controller/subscriptionController");
const subscriptionService = require("../services/subscriptionService");
const notificationService = require("../services/notificationService");
const courseController = require("../controller/courseController");

test("subscription end dates clamp to the last day of shorter months", () => {
  assert.equal(
    subscriptionService
      .addMonths(new Date("2025-01-31T10:00:00.000Z"), 1)
      .toISOString(),
    "2025-02-28T10:00:00.000Z",
  );
  assert.equal(
    subscriptionService
      .addMonths(new Date("2024-01-31T10:00:00.000Z"), 1)
      .toISOString(),
    "2024-02-29T10:00:00.000Z",
  );
});

test("webhook signatures are verified against the Kora payload", (t) => {
  const previousSecret = process.env.KORA_WEBHOOK_SECRET;
  process.env.KORA_WEBHOOK_SECRET = "test-webhook-secret";
  t.after(() => {
    if (previousSecret === undefined) delete process.env.KORA_WEBHOOK_SECRET;
    else process.env.KORA_WEBHOOK_SECRET = previousSecret;
  });
  const payload = { reference: "EES-1", amount: 25000, currency: "NGN" };
  const signature = crypto
    .createHmac("sha256", process.env.KORA_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");
  assert.equal(
    subscriptionService.verifyWebhookSignature(payload, signature),
    true,
  );
  assert.equal(
    subscriptionService.verifyWebhookSignature(payload, `${signature}x`),
    false,
  );
});

test("course access requires an active, unexpired subscription containing the course", async (t) => {
  t.mock.method(Course, "findOne", () => ({
    select() {
      return this;
    },
    lean: async () => ({ price: 25000, accessType: "both" }),
  }));
  t.mock.method(Enrollment, "exists", async () => null);
  let query;
  t.mock.method(Subscription, "findOne", (filter) => {
    query = filter;
    return { select: async () => null };
  });
  const result = await subscriptionService.hasCourseAccess(
    "student-1",
    "course-1",
  );
  assert.equal(result.allowed, false);
  assert.deepEqual(query.status, "active");
  assert.ok(query.renewalDate.$gt instanceof Date);
  assert.equal(query.includedCourses, "course-1");
});

test("an active subscription snapshot grants its assigned published course", async (t) => {
  t.mock.method(Course, "findOne", () => ({
    select() {
      return this;
    },
    lean: async () => ({
      price: 18000,
      accessType: "subscription_only",
      prerequisites: [],
    }),
  }));
  t.mock.method(Enrollment, "exists", async () => null);
  let subscriptionFilter;
  t.mock.method(Subscription, "findOne", (filter) => {
    subscriptionFilter = filter;
    return { select: async () => ({ _id: "sub-1" }) };
  });
  const result = await subscriptionService.hasCourseAccess(
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439013",
  );
  assert.deepEqual(result, { allowed: true, source: "subscription" });
  assert.equal(subscriptionFilter.status, "active");
  assert.equal(subscriptionFilter.includedCourses, "507f1f77bcf86cd799439013");
  assert.ok(subscriptionFilter.renewalDate.$gt instanceof Date);
});

test("prerequisites must be completed before any course entitlement grants access", async (t) => {
  t.mock.method(Course, "findOne", () => ({
    select() {
      return this;
    },
    lean: async () => ({
      price: 18000,
      accessType: "individual_only",
      prerequisites: ["507f1f77bcf86cd799439014"],
    }),
  }));
  t.mock.method(Enrollment, "countDocuments", async () => 0);
  const result = await subscriptionService.hasCourseAccess(
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439013",
  );
  assert.deepEqual(result, { allowed: false, source: null });
});

test("subscription plans validate with no courses assigned", () => {
  assert.equal(
    subscriptionController.validatePlanRequest({
      planId: "premium",
      name: "Premium",
      amount: 50000,
      durationMonths: 6,
      courseIds: [],
    }),
    null,
  );
});

test("admin can create a subscription plan before any courses exist", async (t) => {
  let createdPlan;
  t.mock.method(SubscriptionPlan, "create", async (data) => {
    createdPlan = data;
    return { _id: "plan-1", ...data };
  });
  const response = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await subscriptionController.createPlan(
    {
      body: {
        planId: "premium",
        name: "Premium",
        description: "Courses will be added later.",
        amount: 50000,
        currency: "NGN",
        billingInterval: "one_time",
        durationMonths: 6,
        features: ["Premium support"],
        plannedCourseTitles: ["Course to be created later"],
      },
    },
    response,
  );
  assert.equal(response.statusCode, 201);
  assert.deepEqual(createdPlan.courses, []);
  assert.equal(createdPlan.planId, "premium");
  assert.equal(createdPlan.billingInterval, "one_time");
  assert.deepEqual(createdPlan.plannedCourseTitles, [
    "Course to be created later",
  ]);
});

test("an empty plan cannot initialize a paid subscription", async (t) => {
  t.mock.method(SubscriptionPlan, "findOne", async () => ({
    _id: "plan-1",
    planId: "premium",
    courses: [],
  }));
  t.mock.method(Course, "find", () => ({
    select: async () => [],
  }));
  const response = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await subscriptionController.initialize(
    { body: { planId: "premium" }, user: { _id: "student-1" } },
    response,
  );
  assert.equal(response.statusCode, 409);
  assert.equal(response.body.error.code, "PLAN_COURSES_UNAVAILABLE");
});

test("active plans may be assigned to courses, but inactive plans may not", async (t) => {
  const planId = "507f1f77bcf86cd799439012";
  t.mock.method(SubscriptionPlan, "find", async () => [
    { _id: planId, planId: "beginner", courses: [], courseAccessLimit: 5 },
  ]);
  const valid = await courseController.validateCourseAccess({
    accessType: "both",
    price: 18000,
    subscriptionPlanIds: [planId],
  });
  assert.equal(valid.error, undefined);
  assert.deepEqual(valid.planIds, [planId]);

  t.mock.method(SubscriptionPlan, "find", async () => []);
  const invalid = await courseController.validateCourseAccess({
    accessType: "subscription_only",
    price: 0,
    subscriptionPlanIds: [planId],
  });
  assert.match(invalid.error, /active subscription plans/);
});

test("a published individually purchased course remains accessible without subscription", async (t) => {
  t.mock.method(Course, "findOne", () => ({
    select() {
      return this;
    },
    lean: async () => ({ price: 18000, accessType: "individual_only" }),
  }));
  t.mock.method(Enrollment, "exists", async () => ({ _id: "paid-enrollment" }));
  t.mock.method(Subscription, "findOne", () => {
    throw new Error("individual enrollment should be sufficient");
  });
  const result = await subscriptionService.hasCourseAccess(
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439013",
  );
  assert.deepEqual(result, { allowed: true, source: "enrollment" });
});

test("activation is conditional on a pending payment and calculates the term server-side", async (t) => {
  const pending = {
    _id: "subscription-1",
    student: "507f1f77bcf86cd799439011",
    planName: "Beginner",
    status: "pending",
    durationMonths: 3,
  };
  let filter;
  let update;
  t.mock.method(Subscription, "findOneAndUpdate", async (query, changes) => {
    filter = query;
    update = changes;
    return { ...pending, ...changes.$set };
  });
  let notificationCount = 0;
  t.mock.method(notificationService, "notify", async () => {
    notificationCount += 1;
    return {};
  });
  const activated = await subscriptionService.activate(pending, {
    id: "kora-tx-1",
  });
  assert.deepEqual(filter, { _id: pending._id, status: "pending" });
  assert.equal(update.$set.status, "active");
  assert.equal(update.$set.providerTransactionId, "kora-tx-1");
  assert.equal(
    update.$set.renewalDate.toISOString(),
    subscriptionService.addMonths(update.$set.startedAt, 3).toISOString(),
  );
  assert.equal(activated.status, "active");
  assert.equal(notificationCount, 1);
});

test("subscription plan identifiers are unique and courses use Course references", () => {
  assert.equal(SubscriptionPlan.schema.path("planId").options.unique, true);
  assert.equal(
    SubscriptionPlan.schema.path("courses").options.type[0].ref,
    "Course",
  );
});
