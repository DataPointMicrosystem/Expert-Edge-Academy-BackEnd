module.exports = {
  openapi: "3.0.3",
  info: {
    title: "ExpertEdge Academy API",
    version: "1.0.0",
    description:
      "REST API for course discovery, learning, payments, and platform administration.",
  },
  servers: [{ url: "http://localhost:1023/api" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Success: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: { type: "object" },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          error: { type: "object", properties: { code: { type: "string" } } },
        },
      },
      Course: {
        type: "object",
        properties: {
          title: { type: "string" },
          slug: { type: "string" },
          price: { type: "number" },
          accessType: {
            type: "string",
            enum: ["free", "individual_only", "subscription_only", "both"],
          },
          subscriptionPlanIds: {
            type: "array",
            items: { type: "string" },
          },
          level: { type: "string" },
          rating: { type: "number" },
          status: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: { 200: { description: "Service is available" } },
      },
    },
    "/auth/signup": {
      post: {
        summary: "Register a student or instructor",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fullName", "email", "password"],
                properties: {
                  fullName: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string", format: "password" },
                  role: { type: "string", enum: ["student", "instructor"] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Account created" },
          409: { description: "Email already exists" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Login",
        responses: {
          200: { description: "JWT returned" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/auth/verify-email": {
      post: {
        summary: "Verify email OTP",
        responses: { 200: { description: "Verified" } },
      },
    },
    "/courses": {
      get: {
        summary: "Search and filter published courses",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "level", in: "query", schema: { type: "string" } },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["newest", "popular", "rating", "price_asc", "price_desc"],
            },
          },
        ],
        responses: { 200: { description: "Course list" } },
      },
      post: {
        summary: "Create instructor course",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  accessType: {
                    type: "string",
                    enum: [
                      "free",
                      "individual_only",
                      "subscription_only",
                      "both",
                    ],
                  },
                  subscriptionPlanIds: {
                    type: "array",
                    items: { type: "string" },
                    description: "Only active plans may be assigned.",
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Draft created" } },
      },
    },
    "/courses/{slug}": {
      get: {
        summary: "Get published course details",
        parameters: [
          {
            name: "slug",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Course details" },
          404: { description: "Not found" },
        },
      },
    },
    "/enrollments/{courseId}": {
      post: {
        summary: "Enroll in a free course",
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: "Enrolled" },
          402: { description: "Payment required" },
        },
      },
    },
    "/payments/initialize": {
      post: {
        summary: "Initialize Kora payment",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Kora checkout URL" } },
      },
    },
    "/payments/verify/{reference}": {
      post: {
        summary: "Verify Kora payment server-side",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Enrollment granted" },
          402: { description: "Payment failed" },
        },
      },
    },
    "/subscriptions/plans": {
      get: {
        summary:
          "List active subscription plans, including non-purchasable empty plans",
        responses: {
          200: { description: "Plan catalog with availability metadata" },
        },
      },
    },
    "/subscriptions/plans/{planId}": {
      get: {
        summary: "Get an active subscription plan",
        parameters: [
          {
            name: "planId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Plan details" },
          404: { description: "Plan not found" },
        },
      },
    },
    "/subscriptions/me": {
      get: {
        summary:
          "Get the authenticated user's current subscription and entitlements",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Current subscription" } },
      },
    },
    "/subscriptions/history": {
      get: {
        summary: "Get the authenticated user's subscription payment history",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Subscription history" } },
      },
    },
    "/subscriptions/initialize": {
      post: {
        summary:
          "Initialize a one-time subscription payment using a stored plan amount",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["planId"],
                properties: {
                  planId: { type: "string" },
                  callbackUrl: { type: "string", format: "uri" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Hosted payment initialized" },
          409: {
            description:
              "Existing pending/active subscription or plan has no published courses",
          },
        },
      },
    },
    "/subscriptions/verify/{reference}": {
      post: {
        summary: "Verify a subscription payment server-side",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "reference",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Subscription activated" },
          202: { description: "Payment remains pending" },
          402: { description: "Payment failed or amount mismatch" },
        },
      },
    },
    "/admin/subscription-plans": {
      get: {
        summary: "List all subscription plans",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Admin plan catalog" } },
      },
      post: {
        summary: "Create a plan, optionally with no courses assigned",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          201: { description: "Plan created" },
          400: { description: "Invalid plan configuration" },
          409: { description: "Plan ID already exists" },
        },
      },
    },
    "/admin/subscription-plans/{planId}": {
      patch: {
        summary: "Update plan configuration and assigned course IDs",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "planId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Plan updated" } },
      },
      delete: {
        summary: "Deactivate a plan without revoking existing paid access",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "planId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Plan deactivated" } },
      },
    },
    "/admin/subscriptions": {
      get: {
        summary: "List subscriptions and aggregate status/revenue reporting",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Subscription report" } },
      },
    },
    "/courses/{courseId}/reviews": {
      get: {
        summary: "List course reviews",
        responses: { 200: { description: "Reviews" } },
      },
      post: {
        summary: "Submit enrolled student review",
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: "Review created" } },
      },
    },
    "/admin/analytics": {
      get: {
        summary: "Platform analytics",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Admin analytics" },
          403: { description: "Admin required" },
        },
      },
    },
    "/referrals/me": {
      get: {
        summary: "Get the authenticated user's referral summary",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Referral summary" },
          401: { description: "Authentication required" },
        },
      },
    },
    "/referrals/code": {
      get: {
        summary: "Generate or retrieve the authenticated user's referral code",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Referral code" },
          401: { description: "Authentication required" },
        },
      },
    },
    "/referrals/track": {
      post: {
        summary: "Track a pending referral attribution",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["referralCode", "courseId"],
                properties: {
                  referralCode: { type: "string" },
                  courseId: { type: "string" },
                  sessionId: {
                    type: "string",
                    description: "Stable anonymous browser/session identifier",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Referral tracked" },
          400: { description: "Invalid referral or self-referral" },
          404: { description: "Referral code or course not found" },
        },
      },
    },
    "/referrals/history": {
      get: {
        summary: "Get authenticated referral reward history",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          200: { description: "Referral history" },
          401: { description: "Authentication required" },
        },
      },
    },
  },
};
