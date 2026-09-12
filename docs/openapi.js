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
        responses: { 200: { description: "Referral summary" }, 401: { description: "Authentication required" } },
      },
    },
    "/referrals/code": {
      get: {
        summary: "Generate or retrieve the authenticated user's referral code",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Referral code" }, 401: { description: "Authentication required" } },
      },
    },
    "/referrals/track": {
      post: {
        summary: "Track a pending referral attribution",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["referralCode", "courseId"], properties: { referralCode: { type: "string" }, courseId: { type: "string" }, sessionId: { type: "string", description: "Stable anonymous browser/session identifier" } } } } } },
        responses: { 201: { description: "Referral tracked" }, 400: { description: "Invalid referral or self-referral" }, 404: { description: "Referral code or course not found" } },
      },
    },
    "/referrals/history": {
      get: {
        summary: "Get authenticated referral reward history",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "page", in: "query", schema: { type: "integer", minimum: 1 } }, { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } }],
        responses: { 200: { description: "Referral history" }, 401: { description: "Authentication required" } },
      },
    },
  },
};
