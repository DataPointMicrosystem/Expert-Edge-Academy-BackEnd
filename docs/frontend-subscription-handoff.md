# Frontend Developer Handoff: Courses And Subscriptions

This guide describes the backend contract for the ExpertEdge Academy frontend. It is intended to be handed to the frontend developer or Copilot as implementation instructions. Use backend API responses as the authority for plan availability, price, purchase state, and course access. Local/demo auth state, plan constants, query parameters, and payment redirect success must never unlock paid content.

## Current Database Catalog

Four plan documents are already present in the configured MongoDB database:

| `planId`       | Name         |      Price | Duration | Current state                               |
| -------------- | ------------ | ---------: | -------: | ------------------------------------------- |
| `beginner`     | Beginner     | NGN 25,000 | 3 months | Not purchasable: no actual courses assigned |
| `intermediate` | Intermediate | NGN 40,000 | 3 months | Not purchasable: no actual courses assigned |
| `professional` | Professional | NGN 65,000 | 6 months | Not purchasable: no actual courses assigned |
| `advanced`     | Advanced     | NGN 90,000 | 6 months | Not purchasable: no actual courses assigned |

Their level, description, benefits/features, accent, popularity, and suggested course names are stored. Suggested names are returned as `plannedCourseTitles` and are informational only. The database currently has no Course documents. Each plan has `courses: []`, so the catalog marks all four `isPurchasable: false` with `availabilityMessage: "Courses will be added later."` The UI may display the plan descriptions and suggested names, but must disable Subscribe/Checkout until real published course records have been assigned by an admin.

`plannedCourseTitles` are never course IDs and never grant access. Real entitlements use Mongo Course references in `courses`, which the public API populates as course objects `{ _id, title, slug }`. Do not match titles to courses in the frontend to simulate assignment.

## API Origin, Auth, And Envelope

Use the backend origin plus `/api`; local development is `http://localhost:1023/api`. Requests use JSON. Successful responses use:

```json
{ "success": true, "message": "...", "data": {} }
```

Errors use:

```json
{ "success": false, "message": "...", "error": { "code": "..." } }
```

Send `Authorization: Bearer <JWT>` for student subscription, enrollment/access, and admin endpoints. Student subscription endpoints require the `student` role. Admin plan and subscription reporting endpoints require an `admin` JWT. Plan catalog/detail endpoints are public. Never send price or user ID to initialize a subscription; the backend derives both from the saved plan and bearer-authenticated user.

## Public Plan Catalog

### `GET /api/subscriptions/plans`

Returns active plans, including plans that cannot yet be purchased. The response plan fields include `planId`, `name`, `level`, `accent`, `description`, `amount`, `price`, `currency`, `billingInterval`, `durationMonths`, `courses`, `plannedCourseTitles`, `courseAccessLimit`, `benefits`, `features`, `popular`, `isPurchasable`, `autoRenew`, and `availabilityMessage`.

Example of the current unavailable-plan shape:

```json
{
  "success": true,
  "message": "Subscription plans retrieved",
  "data": [
    {
      "planId": "beginner",
      "name": "Beginner",
      "level": "Start here",
      "accent": "blue",
      "description": "Build the everyday computer confidence you need to learn, work, and explore online.",
      "amount": 25000,
      "price": 25000,
      "currency": "NGN",
      "billingInterval": "one_time",
      "durationMonths": 3,
      "courses": [],
      "plannedCourseTitles": [
        "Desktop Publishing",
        "Computer Fundamentals",
        "Microsoft Word",
        "Internet & Email Basics",
        "Basic Computer Skills"
      ],
      "courseAccessLimit": null,
      "benefits": [
        "5 foundational courses",
        "Learn at your own pace",
        "Completion certificates"
      ],
      "features": [
        "5 foundational courses",
        "Learn at your own pace",
        "Completion certificates"
      ],
      "popular": false,
      "isPurchasable": false,
      "autoRenew": false,
      "availabilityMessage": "Courses will be added later."
    }
  ]
}
```

Render cards from this API response rather than a hardcoded purchasable catalog. For styling, `accent` and `popular` are provided by the backend but remain presentation-only. `price` and `amount` currently have the same value; use `price` for display. Format as NGN. `billingInterval: "one_time"` means manual one-off payment; `autoRenew` is false. Do not show a recurring-billing promise.

### `GET /api/subscriptions/plans/:planId`

Public endpoint returning the same response shape for one active plan. A missing or inactive plan returns `404 PLAN_NOT_FOUND`.

## Student Subscription State

### `GET /api/subscriptions/me`

Requires a student JWT. This is the authoritative current subscription/entitlement request. Call on login/app startup and after payment verification.

No subscription:

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

Active subscription data includes `planId`, `planName`, `billingInterval`, `status`, `startedAt`, `renewalDate`, `amount`, `currency`, and `reference`. `entitlement.courses` contains course objects. When status is pending, `authorizationUrl` is included if checkout was initialized.

Only grant plan access when `entitlement.active === true`. `renewalDate` is the access end date, not the date of a scheduled charge. The backend statuses are `pending`, `active`, `expired`, `failed`, and `abandoned`; only an active, unexpired subscription grants subscription access.

### `GET /api/subscriptions/history`

Requires a student JWT. Returns only that student's subscription records, newest first. Use this in a payment/subscription history view; don't infer active entitlement from a historic successful record.

## Subscription Checkout

### `POST /api/subscriptions/initialize`

Requires a student JWT. Send a plan ID and optional callback URL only:

```json
{
  "planId": "beginner",
  "callbackUrl": "https://frontend.example/subscriptions/return"
}
```

Do not send `amount`, `price`, `studentId`, or a course list. The backend loads price and course assignments from MongoDB. It refuses plans without published course assignments using `409 PLAN_COURSES_UNAVAILABLE`; the four current plans will return this until their course IDs are assigned.

For a purchasable plan, response data is:

```json
{
  "subscriptionId": "...",
  "planId": "beginner",
  "reference": "EES-...",
  "authorizationUrl": "https://...",
  "provider": "kora"
}
```

The provider in this backend is Kora, not Paystack. Save `reference` in session storage before leaving the site, then redirect the browser to `authorizationUrl`. Never activate UI access because a redirect happened or because the browser has payment query parameters.

### `POST /api/subscriptions/verify/:reference`

Requires the same student's JWT. Call this on the payment-return page using the saved reference. The backend verifies the transaction directly with Kora and checks amount/currency before activation.

- `200`: payment confirmed; clear pending reference and refresh `/subscriptions/me`.
- `202`: payment still pending; keep access locked and allow a later retry/refresh.
- `402 PAYMENT_NOT_SUCCESSFUL` or `PAYMENT_MISMATCH`: keep access locked and show a safe failure/retry state.
- `404 SUBSCRIPTION_NOT_FOUND`: reference does not belong to this account or does not exist.

The provider webhook is server-to-server at `POST /api/subscriptions/webhook`; the frontend does not call it.

## Recommended Student UI Flow

1. Load `GET /subscriptions/plans`; when signed in, also load `GET /subscriptions/me`.
2. Render the server catalog. Show `availabilityMessage` and disable Subscribe when `isPurchasable` is false. Current stored planned titles are preview metadata, not confirmed course records.
3. When the user chooses an available plan, call initialize with `planId` and the frontend return URL, save `reference`, then redirect to `authorizationUrl`.
4. On the return screen, call verify with the stored reference. If pending, retain the pending state and offer retry. Never unlock on redirect alone.
5. On verified payment, refresh `/subscriptions/me` and use its entitlement list to render course access.
6. On HTTP 409 `SUBSCRIPTION_ALREADY_EXISTS`, refresh `/subscriptions/me`: resume the pending `authorizationUrl` or show the active plan/end date.
7. On sign-out, clear local subscription display state. On next sign-in, fetch the current state again.

All current plans are one-time/manual and `autoRenew` is false. A second subscription purchase is blocked while the student has a pending purchase or active term; after expiry the student may purchase again. There is no active-term cancellation endpoint.

## Course Access And Individual Purchase

### `GET /api/enrollments/access/:courseId`

Requires a student JWT. Response data on success:

```json
{
  "courseId": "66f0123456789abcdef01234",
  "access": { "granted": true, "source": "subscription" },
  "enrollment": null
}
```

`source` may be `subscription`, `enrollment`, or `free`. HTTP 403 `COURSE_ACCESS_DENIED` means keep protected learning UI locked.

### Course details and learning

`GET /api/courses/:slug` is public and returns `data.access`; non-preview lesson media URLs are omitted without access. The app should check access before entering lesson/progress/quiz workflows and handle backend 403s. Backend access checks verify the course is published and prerequisites are complete.

Individual course checkout remains independent of subscriptions:

- `POST /api/payments/initialize` accepts `courseId` and optional referral/callback fields. The server loads price and student identity.
- `POST /api/payments/verify/:reference` verifies with Kora and creates/activates the permanent individual enrollment after confirmed payment.
- `GET /api/payments/history` returns the current student's purchase history.

A valid individual paid enrollment remains valid after subscription expiry. The backend prevents duplicate individual charges when the student already has individual/free enrollment or active subscription coverage. If a course has `accessType: "subscription_only"`, individual payment initialization is rejected.

## Course Create/Edit Access Fields

Instructor/admin course create (`POST /api/courses`) and update (`PUT /api/courses/:courseId`) accept:

```json
{
  "accessType": "both",
  "price": 18000,
  "subscriptionPlanIds": ["66f0123456789abcdef01234"]
}
```

Access types:

- `free`: zero price and no plan assignments.
- `individual_only`: positive price and no plan assignments.
- `subscription_only`: one or more active plans; individual checkout is blocked.
- `both`: positive price and one or more active plans.

Only active plans can be newly assigned. The backend enforces plan course limits and existing course ownership/approval rules. Do not auto-assign every course to every plan. Current course records do not exist yet, so there are no real assignment IDs to show in course forms.

## Admin Plan Management (Optional Admin UI)

All `/api/admin/*` routes require `Authorization: Bearer <admin JWT>`.

- `GET /api/admin/subscription-plans`: list active and inactive plans.
- `POST /api/admin/subscription-plans`: create a plan, including an empty plan.
- `PATCH /api/admin/subscription-plans/:planId`: update plan fields and assignments. `courseIds: []` removes assignments.
- `DELETE /api/admin/subscription-plans/:planId`: deactivate/archive; it prevents new purchases but does not revoke existing paid subscription snapshots.
- `GET /api/admin/subscriptions?status=active`: inspect subscriptions and aggregate status/revenue report. Supported status filters are `pending`, `active`, `expired`, `failed`, and `abandoned`.

Create/update uses Course IDs only for actual assignments. `plannedCourseTitles` are informational. Admins can configure a plan before courses exist; a positive price, duration, and plan ID are still required. Example create body:

```json
{
  "planId": "custom-plan",
  "name": "Custom Plan",
  "level": "Career ready",
  "description": "Courses will be added later.",
  "amount": 50000,
  "currency": "NGN",
  "billingInterval": "one_time",
  "durationMonths": 6,
  "courseAccessLimit": 8,
  "courseIds": [],
  "plannedCourseTitles": ["Planned course title"],
  "features": ["Project-based learning"],
  "accent": "gold",
  "popular": false
}
```

## Error Handling

| Status/code                                       | Frontend action                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `401` auth error                                  | Re-authenticate; don't retry checkout as another user.                               |
| `403 COURSE_ACCESS_DENIED`                        | Keep course locked; show individual/plan access options.                             |
| `404 PLAN_NOT_FOUND`                              | Refresh plan catalog; plan may have been deactivated.                                |
| `409 PLAN_COURSES_UNAVAILABLE`                    | Show courses-coming-later state; don't redirect to payment.                          |
| `409 SUBSCRIPTION_ALREADY_EXISTS`                 | Refresh `/subscriptions/me` and resume pending checkout or show active subscription. |
| `409 COURSE_INCLUDED_IN_SUBSCRIPTION`             | User already has this course through current plan; open learning flow.               |
| `402 PAYMENT_NOT_SUCCESSFUL` / `PAYMENT_MISMATCH` | Keep access locked; show a safe failure state.                                       |
| `202` from verify                                 | Payment remains pending; keep access locked and allow retry.                         |

## Backend/Frontend Decisions And Limits

- Payment provider currently implemented: Kora. There is no Paystack implementation in this backend; do not change provider integration from frontend work.
- Billing: manual one-time terms only. No automatic recurring charges or subscription cancellation endpoint.
- Course catalog: empty in the currently configured DB. The four plans exist but are not purchasable until real published Course documents are assigned.
- Frontend code is not in this workspace; this document defines the integration contract but frontend components must be updated in the frontend repository.
- Media: API responses omit protected media fields for users without access, but existing Cloudinary assets use public URLs. A previously exposed URL cannot be revoked by this API check; origin-level media protection needs private/authenticated Cloudinary delivery and signed playback URLs.

## Frontend Copilot Checklist

- Replace local/demo subscription authority with `GET /subscriptions/me`.
- Render `GET /subscriptions/plans`; disable purchase for `isPurchasable: false`.
- Treat `plannedCourseTitles` as display-only; never use it for course routing or access.
- Use stable `_id`/`slug` from actual `courses` for course links and keys.
- Send only `planId` to subscription initialize; preserve the returned reference through checkout.
- Verify server-side after Kora return; refresh `/subscriptions/me` before showing active status.
- Implement unauthenticated, empty catalog, unavailable plan, pending, active, expired, failed, abandoned, and retry states.
- Keep course checks server-authoritative; handle 403 responses for course, lesson, quiz, and progress actions.
