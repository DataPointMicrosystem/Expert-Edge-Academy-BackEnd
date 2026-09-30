# Frontend Subscription Handoff

This document is for the frontend Copilot implementing or repairing ExpertEdge Academy subscription UI. It describes the backend contract as implemented. Use the API as the authority for plan price, included courses, payment state, and access. The frontend's local subscription demo state must not grant access.

## Current Setup State

The configured backend database currently has no subscription plans, courses, categories, or users. Until an admin creates the required catalog data, `GET /api/subscriptions/plans` returns an empty array and subscription checkout cannot succeed. Show an appropriate unavailable/empty state; do not silently offer local demo plans as purchasable products. An admin must first create course records and then create the plans with their course IDs.

The plan IDs and UI catalog values intended for setup are:

| planId         | Name         | Price (NGN) |     Term |
| -------------- | ------------ | ----------: | -------: |
| `beginner`     | Beginner     |       25000 | 3 months |
| `intermediate` | Intermediate |       40000 | 3 months |
| `professional` | Professional |       65000 | 6 months |
| `advanced`     | Advanced     |       90000 | 6 months |

The backend plan API returns `planId`, `name`, `description`, `price`, `amount`, `currency`, `durationMonths`, `courses`, and `benefits`. `courses` is an array of course objects with `_id`, `title`, and `slug`, not the display-name strings in the old frontend constant. Use `_id` or `slug` as the key. The `level`, `accent`, and `popular` properties in the old frontend constant are presentation metadata and are not returned or stored by the backend; those may remain in frontend configuration keyed by `planId`. Do not use local `price` or `courses` as checkout authority.

## Base URL And Authentication

Use the configured backend origin plus `/api` (development: `http://localhost:1023/api`). The success envelope is `{ "success": true, "message": "...", "data": ... }`. Errors use `{ "success": false, "message": "...", "error": { "code": "..." } }`.

Send `Authorization: Bearer <JWT>` for `/subscriptions/me`, `/subscriptions/initialize`, `/subscriptions/verify/:reference`, and enrollment access. Subscription routes require a `student` account. The public plan list and Kora webhook do not use the student's JWT. The client must never send a user ID or price to establish ownership or payment amount.

## Student Endpoints

### List purchasable plans

```http
GET /api/subscriptions/plans
```

Public endpoint. Returns only active admin-configured plans.

```json
{
  "success": true,
  "message": "Subscription plans retrieved",
  "data": [
    {
      "planId": "beginner",
      "name": "Beginner",
      "description": "Build everyday computer confidence.",
      "amount": 25000,
      "price": 25000,
      "currency": "NGN",
      "durationMonths": 3,
      "courses": [
        {
          "_id": "66f0123456789abcdef01234",
          "title": "Computer Fundamentals",
          "slug": "computer-fundamentals"
        }
      ],
      "benefits": ["Foundational courses", "Learn at your own pace"]
    }
  ]
}
```

Use `price` for display; `amount` is the payment-oriented alias. The server uses its stored amount during initialization, even if the browser submits a different value.

### Get the current user's subscription

```http
GET /api/subscriptions/me
Authorization: Bearer <JWT>
```

No subscription record:

```json
{
  "success": true,
  "message": "No subscription found",
  "data": {
    "subscription": null,
    "entitlement": { "active": false, "courses": [] }
  }
}
```

Active subscription (abbreviated):

```json
{
  "success": true,
  "message": "Subscription retrieved",
  "data": {
    "subscription": {
      "planId": "beginner",
      "planName": "Beginner",
      "status": "active",
      "startedAt": "2026-09-30T12:00:00.000Z",
      "renewalDate": "2026-12-30T12:00:00.000Z",
      "amount": 25000,
      "currency": "NGN",
      "reference": "EES-..."
    },
    "entitlement": {
      "active": true,
      "courses": [
        {
          "_id": "66f0123456789abcdef01234",
          "slug": "computer-fundamentals",
          "title": "Computer Fundamentals"
        }
      ]
    }
  }
}
```

For a pending purchase, `subscription.status` is `pending`, dates are null, and `authorizationUrl` is included when available so the user can resume hosted checkout. When `entitlement.active` is false, do not show paid access even if an old local state says active.

### Initialize checkout

```http
POST /api/subscriptions/initialize
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "planId": "beginner",
  "callbackUrl": "https://frontend.example/subscriptions/return"
}
```

Only `planId` is required. `callbackUrl` is optional if the backend has `FRONTEND_PAYMENT_CALLBACK_URL` configured.

```json
{
  "success": true,
  "message": "Subscription payment initialized",
  "data": {
    "subscriptionId": "...",
    "planId": "beginner",
    "reference": "EES-...",
    "authorizationUrl": "https://...",
    "provider": "kora"
  }
}
```

Before redirecting, save `data.reference` in session storage under a subscription-specific key. Redirect the browser to `data.authorizationUrl`; do not mark the user active based on the redirect, query parameters, or a frontend callback alone.

### Verify after hosted checkout

```http
POST /api/subscriptions/verify/EES-...
Authorization: Bearer <JWT>
```

The reference must be the one returned by initialize and belongs to the authenticated user. The backend checks Kora's server response, amount, and currency before activation.

Confirmed response data:

```json
{
  "subscriptionId": "...",
  "planId": "beginner",
  "status": "active",
  "startedAt": "2026-09-30T12:00:00.000Z",
  "renewalDate": "2026-12-30T12:00:00.000Z",
  "amount": 25000,
  "currency": "NGN",
  "reference": "EES-..."
}
```

If verification returns HTTP 202, payment is still pending. Keep the UI in a pending state and retry verification or refresh `/subscriptions/me`; do not grant access. After a confirmed response, clear the saved reference and refresh `/subscriptions/me` before rendering active benefits.

## Recommended UI Flow

1. On subscription page load, request `GET /subscriptions/plans` and `GET /subscriptions/me` in parallel when signed in. Render the server catalog and the user's current entitlement.
2. If the plan list is empty, show that plans are not available yet and disable purchase actions. Do not fill in the plan list from local data as if it were purchasable.
3. If there is no current subscription, allow selecting a server-returned plan. Send only its `planId` to initialize.
4. If initialize returns HTTP 409 with `SUBSCRIPTION_ALREADY_EXISTS`, refresh `/subscriptions/me`. If it is pending, offer its `authorizationUrl` to resume; if active, show the current plan/end date.
5. On the hosted-payment return screen, retrieve the saved reference and call verify. Show pending/failure states explicitly. On success, refresh current subscription and the user's course access.
6. On app startup/login, refresh `/subscriptions/me`. Local state may cache the response for display, but must never authoritatively unlock a course.

Backend statuses are `pending`, `active`, `expired`, `failed`, and `abandoned`. Only `active` with `entitlement.active === true` grants paid access. `renewalDate` is the end of access, not a scheduled charge. Terms are one-time payments; there is no automatic renewal. A new purchase is blocked while one is pending or active, and may be started after expiry.

## Course Access

```http
GET /api/enrollments/access/:courseId
Authorization: Bearer <JWT>
```

Access response data:

```json
{
  "courseId": "66f0123456789abcdef01234",
  "access": { "granted": true, "source": "subscription" },
  "enrollment": null
}
```

`source` can be `subscription` or `enrollment`. Denied access returns HTTP 403 with `error.code: "COURSE_ACCESS_DENIED"`. Course detail (`GET /api/courses/:slug`) is public, but includes `data.access`; without access, non-preview lesson media fields are omitted. The frontend should still use the access endpoint before entering a course. Do not infer access from a plan card, enrollment row alone, or client-side subscription state.

The backend creates subscription-linked enrollment records after confirmed payment so current learning/progress flows can use them. They stop granting access after the subscription expires. Individual course purchases and free enrollments remain separate access sources.

## Error Handling

| HTTP | Error code                                                        | Frontend behavior                                                             |
| ---: | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- |
|  401 | `AUTH_TOKEN_MISSING`, `AUTH_TOKEN_INVALID`, `ACCOUNT_UNAVAILABLE` | Refresh auth or ask the user to sign in.                                      |
|  403 | `COURSE_ACCESS_DENIED`                                            | Show the plan/course purchase path; do not expose protected course content.   |
|  404 | `PLAN_NOT_FOUND`                                                  | Refresh the catalog; the plan may have been archived.                         |
|  409 | `SUBSCRIPTION_ALREADY_EXISTS`                                     | Refresh `/subscriptions/me`; resume pending checkout or show the active term. |
|  402 | `PAYMENT_NOT_SUCCESSFUL`, `PAYMENT_MISMATCH`                      | Keep access locked; show retry/support state and refresh `/subscriptions/me`. |
|  202 | pending verify response                                           | Keep the payment pending; retry verification or refresh current state.        |

All errors use `{ "success": false, "message": "...", "error": { "code": "..." } }`. Avoid showing raw provider messages to users.

## Admin Catalog Setup (Optional Frontend Work)

These endpoints are for an admin plan-management screen, not the student purchase UI. They require a Bearer token for an `admin` user:

- `GET /api/admin/subscription-plans` lists active and archived plans.
- `POST /api/admin/subscription-plans` creates a plan.
- `PATCH /api/admin/subscription-plans/:planId` updates plan fields.
- `DELETE /api/admin/subscription-plans/:planId` archives a plan.

Create payload uses course IDs, not titles:

```json
{
  "planId": "beginner",
  "name": "Beginner",
  "description": "Build everyday computer confidence.",
  "amount": 25000,
  "durationMonths": 3,
  "courseIds": ["66f0123456789abcdef01234"],
  "benefits": [
    "5 foundational courses",
    "Learn at your own pace",
    "Completion certificates"
  ]
}
```

The configured database currently has no courses or plans, so an admin must create the courses and then populate the four plans before the student plan endpoint returns products. The frontend can be implemented against the contract now, but production checkout must remain disabled until that catalog setup is complete.

## Implementation Checklist For Frontend Copilot

- Replace local/demo subscription authority with `GET /subscriptions/me`.
- Load the purchasable catalog from `GET /subscriptions/plans` and handle an empty list.
- Preserve `planId` and `reference` through the external Kora redirect.
- Verify with the backend after redirect; only the verified backend response unlocks access.
- Add pending, active, expired, failed, abandoned, unauthenticated, and empty-catalog states.
- Use returned course `_id` or `slug` for links/keys; use `title` only as display text.
- Keep visual-only plan styling keyed by `planId`; do not make frontend price/course lists authoritative.
- Check access before course learning actions and honor 403 responses.

## Media Caveat

The API withholds non-preview lesson media URLs from users without entitlement. Existing Cloudinary uploads use public delivery URLs, however, so a URL exposed previously cannot be revoked by this API check. Full origin-level protection requires migrating lesson media to private/authenticated Cloudinary delivery with signed playback URLs.
