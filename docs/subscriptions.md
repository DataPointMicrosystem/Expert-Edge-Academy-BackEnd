# Subscriptions

Subscriptions use the payment provider currently implemented in this backend: Kora. A term is paid once; the backend does not charge again automatically. `billingInterval` describes the plan term, but does not enable recurring charges. A new purchase is blocked while a user has a pending purchase or an unexpired active term. Once a term expires, another purchase starts a new term at the time Kora confirms payment. There is no active-term cancellation route because recurring billing is not enabled.

## Plans

Plans are managed by admins and can be created before any courses exist. `plannedCourseTitles` may preserve an initial display list, but it is descriptive metadata only; it never grants access. Actual entitlement assignments must use `courseIds` referencing Course records. `courseIds` may be omitted or set to `[]`. An active plan with no published assigned courses appears in the public catalog with `isPurchasable: false` and `availabilityMessage: "Courses will be added later."`; checkout rejects it with `PLAN_COURSES_UNAVAILABLE`. Checkout snapshots published course IDs so later plan edits or deactivation do not change access already paid for.

Admin routes require a Bearer token with the `admin` role:

- `GET /api/admin/subscription-plans` lists active and archived plans.
- `POST /api/admin/subscription-plans` creates a plan.
- `PATCH /api/admin/subscription-plans/:planId` updates name, price, interval, duration, features, course limit, course assignments, or active state. Send `courseIds: []` to remove all assignments.
- `DELETE /api/admin/subscription-plans/:planId` archives a plan without changing existing subscriptions.
- `GET /api/admin/subscriptions` lists subscriptions and reports status counts and confirmed revenue.

Create request:

```json
{
  "planId": "beginner",
  "name": "Beginner",
  "level": "Start here",
  "description": "Courses will be added later.",
  "amount": 25000,
  "currency": "NGN",
  "billingInterval": "one_time",
  "durationMonths": 3,
  "courseAccessLimit": 5,
  "courseIds": [],
  "plannedCourseTitles": ["Computer Fundamentals"],
  "features": ["Foundational courses", "Completion certificates"]
}
```

## Student Routes

All routes except the public plan list and provider webhook require `Authorization: Bearer <token>` and the student role. Responses use the standard `{ success, message, data }` envelope.

- `GET /api/subscriptions/plans` returns active plans with course IDs, slugs, and titles. Empty or unpublished-only plans remain visible for disclosure but include `isPurchasable: false` and an availability message. Catalog entries include `price` for direct display and `amount` as its payment-oriented alias.
- `GET /api/subscriptions/plans/:planId` returns active plan details.
- `GET /api/subscriptions/me` returns only the authenticated user's latest subscription and current entitlement. When that subscription is pending, it also returns `authorizationUrl` so checkout can be resumed.
- `GET /api/subscriptions/history` returns only the authenticated user's subscription transaction records.
- `POST /api/subscriptions/initialize` accepts `{ "planId": "beginner", "callbackUrl": "https://frontend.example/checkout/complete" }`.
- `POST /api/subscriptions/verify/:reference` verifies that user's payment with Kora.
- `POST /api/subscriptions/webhook` accepts Kora events and validates `x-korapay-signature` before server-side verification.

Initialize response:

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

The frontend redirects to `data.authorizationUrl`, then calls `POST /api/subscriptions/verify/:reference` after return. It should refresh `GET /api/subscriptions/me`; client-side/local subscription state is display-only. The frontend can keep rendering its catalog by joining plan IDs with `GET /api/subscriptions/plans`, or transition to using the server-returned catalog as authoritative for current price and included courses.

`GET /api/subscriptions/me` returns `subscription: null` and `{ "entitlement": { "active": false, "courses": [] } }` when the user has no payment record. A subscription's API status is one of `pending`, `active`, `expired`, `failed`, or `abandoned`; the current frontend's `active` and `pending` states remain supported. Treat every other status as no paid entitlement. `renewalDate` is the server-calculated end of access, not an automatic billing date. `startedAt` and `renewalDate` are null until Kora confirms payment.

Example current response data:

```json
{
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
        "_id": "...",
        "slug": "computer-fundamentals",
        "title": "Computer Fundamentals"
      }
    ]
  }
}
```

Course authorization also accepts existing course enrollments. `GET /api/enrollments/access/:courseId` reports its access source, and public course detail responses omit non-preview lesson media URLs unless the authenticated user has an enrollment or active subscription for that course. The server checks subscription end dates at access time; pending, failed, abandoned, and expired records do not grant course access.

## Deployment

Set the existing Kora secret and webhook signing secret (`KORA_SECRET_KEY` and `KORA_WEBHOOK_SECRET`, or the supported Korapay aliases). Set `SUBSCRIPTION_WEBHOOK_URL` to the public `/api/subscriptions/webhook` URL; if omitted, the existing payment webhook URL is used. Currency is currently restricted to NGN. Plan intervals are manual terms; no recurring charge is attempted. No user backfill or SQL migration is needed. Mongoose creates the `SubscriptionPlan` and `Subscription` collections and their indexes; ensure index creation is enabled in production, especially for the unique `currentKey` and `reference` indexes.

The project does not contain a Paystack integration; existing course purchase and subscription code call Kora. Resolve the requested Paystack-versus-Kora change before replacing payment code. The frontend source project is not present in this backend workspace, so these changes do not modify frontend components.

Course APIs withhold non-preview lesson media URLs from users without entitlement. The existing Cloudinary upload path stores default public delivery URLs, so this API check cannot revoke a URL that was previously exposed or copied. Origin-level enforcement for already-uploaded lesson media requires a separate migration to authenticated/private Cloudinary delivery and signed playback URLs; public thumbnails and other public assets should remain unaffected.
