const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const Subscription = require("../model/subscription");
const SubscriptionPlan = require("../model/subscriptionPlan");
const Enrollment = require("../model/enrollment");
const subscriptionService = require("../services/subscriptionService");

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

test("activation is conditional on a pending payment and calculates the term server-side", async (t) => {
  const pending = {
    _id: "subscription-1",
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
});

test("subscription plan identifiers are unique and courses use Course references", () => {
  assert.equal(SubscriptionPlan.schema.path("planId").options.unique, true);
  assert.equal(
    SubscriptionPlan.schema.path("courses").options.type[0].ref,
    "Course",
  );
});
