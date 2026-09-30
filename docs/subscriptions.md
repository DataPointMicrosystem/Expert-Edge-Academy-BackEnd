# Subscriptions

Subscriptions use the existing Kora payment integration. A term is paid once; the backend does not charge again automatically. A new purchase is blocked while a user has a pending purchase or an unexpired active term. Once a term expires, another purchase starts a new term at the time Kora confirms payment.

## Plans

Plans are managed by admins. There are no seeded plan or course-name mappings. Create the four catalog plans (`beginner` NGN 25,000 for 3 months, `intermediate` NGN 40,000 for 3 months, `professional` NGN 65,000 for 6 months, and `advanced` NGN 90,000 for 6 months) with course ObjectIds selected from the database. Plan course assignments are stored as Course references; checkout snapshots these references so later plan edits do not alter an existing paid term.

Admin routes require a Bearer token with the `admin` role:

- `GET /api/admin/subscription-plans` lists active and archived plans.
- `POST /api/admin/subscription-plans` creates a plan.
- `PATCH /api/admin/subscription-plans/:planId` updates its name, price, duration, benefits, courses, or active state.
- `DELETE /api/admin/subscription-plans/:planId` archives a plan without changing existing subscriptions.

Create request:

```json
{
  "planId": "beginner",
  "name": "Beginner",
  "description": "Start here",
  "amount": 25000,
  "durationMonths": 3,
  "courseIds": ["66f0123456789abcdef01234"],
  "benefits": ["Foundational courses", "Completion certificates"]
}
```

## Student Routes

All routes except the public plan list and provider webhook require `Authorization: Bearer <token>` and the student role. Responses use the standard `{ success, message, data }` envelope.

- `GET /api/subscriptions/plans` returns active plans with course IDs, slugs, and titles. Catalog entries include `price` for direct display and `amount` as its payment-oriented alias.
- `GET /api/subscriptions/me` returns only the authenticated user's latest subscription and current entitlement. When that subscription is pending, it also returns `authorizationUrl` so checkout can be resumed.
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

Set the existing Kora secret and webhook signing secret (`KORA_SECRET_KEY` and `KORA_WEBHOOK_SECRET`, or the supported Korapay aliases). Set `SUBSCRIPTION_WEBHOOK_URL` to the public `/api/subscriptions/webhook` URL; if omitted, the existing payment webhook URL is used. No user backfill or SQL migration is needed. Mongoose creates the `SubscriptionPlan` and `Subscription` collections and their indexes; ensure index creation is enabled in production, especially for the unique `currentKey` and `reference` indexes.

Course APIs withhold non-preview lesson media URLs from users without entitlement. The existing Cloudinary upload path stores default public delivery URLs, so this API check cannot revoke a URL that was previously exposed or copied. Origin-level enforcement for already-uploaded lesson media requires a separate migration to authenticated/private Cloudinary delivery and signed playback URLs; public thumbnails and other public assets should remain unaffected.
