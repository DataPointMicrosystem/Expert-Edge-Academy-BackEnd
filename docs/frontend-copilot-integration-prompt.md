# ExpertEdge Academy Frontend Integration Prompt

Copy everything below and give it to the frontend Copilot.

---

You are integrating the existing ExpertEdge Academy frontend with the deployed backend API.

## Backend Configuration

Use this API base URL for every backend request:

```text
https://expert-edge-academy-backend.onrender.com/api
```

Backend health check:

```text
GET https://expert-edge-academy-backend.onrender.com/api/health
```

Swagger documentation:

```text
https://expert-edge-academy-backend.onrender.com/api/docs
```

OpenAPI JSON:

```text
https://expert-edge-academy-backend.onrender.com/api/openapi.json
```

Do not hardcode the full URL throughout the application. Create one frontend environment variable:

```env
VITE_API_BASE_URL=https://expert-edge-academy-backend.onrender.com/api
```

For Next.js, use:

```env
NEXT_PUBLIC_API_BASE_URL=https://expert-edge-academy-backend.onrender.com/api
```

## Main Instructions

1. Inspect the existing frontend before editing.
2. Preserve the existing design, routes, components, layout, and user experience.
3. Replace mock/static course, user, cart, and dashboard data with real API requests.
4. Do not invent endpoint names. Use only the endpoints listed below.
5. Create a centralized API client instead of calling `fetch` or `axios` randomly inside components.
6. Store the JWT securely according to the current frontend architecture. Never expose secrets in frontend code.
7. Send this header on every protected request:

```http
Authorization: Bearer <accessToken>
```

8. Handle loading, empty, success, unauthorized, forbidden, validation, payment, and server-error states.
9. If the API returns HTTP 401, clear the invalid authentication state and redirect to `/login` where appropriate.
10. If the API returns HTTP 403, show a permission or verification message without pretending the action succeeded.
11. Do not mark a payment successful based only on a frontend redirect. Always call the backend verification endpoint.
12. Do not expose Kora, Cloudinary, Brevo, MongoDB, JWT, or any other backend secret in the frontend.
13. Do not modify the backend from the frontend project.
14. Do not redesign the application unless an existing flow cannot be connected without a small UI adjustment.
15. Work incrementally and test every connected flow.

## Standard API Responses

Success responses look like:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "meta": {}
}
```

The `meta` property is optional.

Error responses look like:

```json
{
  "success": false,
  "message": "User-friendly message",
  "error": {
    "code": "ERROR_CODE",
    "details": "Optional details"
  }
}
```

Use `message` for the user-facing message and `error.code` for programmatic handling.

## Authentication

### Register

```http
POST /auth/signup
```

Request:

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "strong-password",
  "role": "student"
}
```

Allowed roles for public registration:

```text
student
instructor
```

Do not allow public registration as `admin`.

The backend also supports the legacy alias:

```http
POST /auth/sign-up
```

After registration, show the email verification flow.

### Login

```http
POST /auth/login
```

Request:

```json
{
  "email": "jane@example.com",
  "password": "strong-password"
}
```

Success data includes:

```json
{
  "token": "JWT_TOKEN",
  "user": {
    "id": "USER_ID",
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "role": "student",
    "isVerified": true
  }
}
```

Persist the token and user session using the existing frontend auth state system.

### Verify email

```http
POST /auth/verify-email
```

Request:

```json
{
  "email": "jane@example.com",
  "otp": "123456"
}
```

### Resend verification code

Use this exact endpoint:

```http
POST /auth/resend-verification
```

Request:

```json
{
  "email": "jane@example.com"
}
```

### Forgot password

```http
POST /auth/forgot-password
```

Request:

```json
{
  "email": "jane@example.com"
}
```

### Reset password

```http
POST /auth/reset-password
```

Request:

```json
{
  "email": "jane@example.com",
  "otp": "123456",
  "newPassword": "new-strong-password"
}
```

### Google OAuth

Start Google authentication at:

```text
GET /auth/auth/google
```

The Google callback is:

```text
GET /auth/auth/google/callback
```

Only render/use Google OAuth if the current frontend already has that flow configured.

## Current User and Profiles

All endpoints in this section require a bearer token.

### Get current user

```http
GET /users/me
```

### Update profile

```http
PUT /users/profile
```

Possible request fields:

```json
{
  "fullName": "Jane Doe",
  "bio": "Frontend developer",
  "avatar": "https://...",
  "phone": "+234...",
  "country": "Nigeria",
  "expertise": ["React", "JavaScript"],
  "experience": 5,
  "socialLinks": {
    "website": "https://...",
    "linkedin": "https://..."
  }
}
```

### Change password

```http
PUT /users/change-password
```

Request:

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

### Public instructor profile

```http
GET /users/:userId
```

### Dashboards

Student dashboard:

```http
GET /users/dashboard/student
```

Instructor dashboard:

```http
GET /users/dashboard/instructor
```

Only show the instructor dashboard when the authenticated user role is `instructor`.

## Courses and Categories

### List/search published courses

```http
GET /courses
```

Supported query parameters:

```text
search
category
instructor
level
minPrice
maxPrice
minRating
isFree=true|false
sort=newest|popular|rating|price_asc|price_desc
featured=true|false
trending=true|false
page
limit
```

Example:

```text
/courses?search=react&level=Beginner&sort=rating&page=1&limit=12
```

The response is paginated:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 0,
    "pages": 0
  }
}
```

### Featured and trending courses

```http
GET /courses/featured
GET /courses/trending
```

### Course details

```http
GET /courses/:slug
```

The course detail response includes the course, instructor, category, sections, and lessons.

### Categories

```http
GET /categories
```

The response includes category course counts where available.

## Student Enrollment and Learning

Student-only endpoints require a bearer token and the `student` role.

### Enroll in a free course

```http
POST /enrollments/:courseId
```

This endpoint only works for free courses. Paid courses must use the payment flow.

### List enrolled courses

```http
GET /enrollments/my-courses
```

Optional query:

```text
?status=active
?status=completed
?status=dropped
```

### Get enrollment and learning content

```http
GET /enrollments/:enrollmentId
```

### Update lesson progress

```http
PUT /enrollments/:enrollmentId/progress
```

Request:

```json
{
  "lessonId": "LESSON_ID",
  "isCompleted": true,
  "watchedDuration": 120
}
```

The backend calculates completion percentage. Do not calculate or trust the percentage on the frontend.

### Check course access

```http
GET /enrollments/access/:courseId
```

## Cart

Student-only endpoints:

```http
GET /cart
POST /cart/add/:courseId
DELETE /cart/remove/:courseId
DELETE /cart/clear
```

The backend prevents duplicate cart items and prevents adding already-enrolled courses.

## Wishlist

Student-only endpoints:

```http
GET /wishlist
POST /wishlist/add/:courseId
DELETE /wishlist/remove/:courseId
```

## Kora Payments

Never call Kora directly from the frontend. The frontend only calls the backend.

### Initialize payment

```http
POST /payments/initialize
```

Request:

```json
{
  "courseId": "COURSE_ID",
  "callbackUrl": "https://expertedgeacademy.vercel.app/payment/callback"
}
```

Success data includes:

```json
{
  "paymentId": "PAYMENT_ID",
  "reference": "EEA-...",
  "authorizationUrl": "https://checkout.korapay.com/...",
  "provider": "kora"
}
```

Redirect the browser to `authorizationUrl`.

### Verify payment after redirect

Kora returns a payment reference to the configured callback URL. Call:

```http
POST /payments/verify/:reference
```

Only after this backend request returns success should the frontend show enrollment/course access.

Possible outcomes:

- `200`: payment successful and enrollment created
- `202`: payment is still pending
- `402`: payment failed, abandoned, or amount/status validation failed
- `404`: payment reference not found

Never trust a frontend query parameter alone.

### Payment history

```http
GET /payments/history
```

## Reviews and Ratings

### List reviews

```http
GET /reviews/courses/:courseId
```

### Submit review

Only enrolled students can submit reviews:

```http
POST /reviews/courses/:courseId
```

Request:

```json
{
  "title": "Excellent course",
  "content": "Clear and practical.",
  "rating": 5
}
```

### Update/delete review

```http
PUT /reviews/:reviewId
DELETE /reviews/:reviewId
```

## Certificates

```http
GET /certificates
GET /certificates/:certificateId
GET /certificates/verify/:verificationCode
```

Certificates are generated by the backend after course completion. Do not generate certificates in frontend code.

## Notifications

All notification endpoints require authentication:

```http
GET /notifications
GET /notifications?unread=true
PUT /notifications/:notificationId
PUT /notifications/read-all
```

## Referrals

Authenticated referral summary:

```http
GET /referrals/me
```

Generate or retrieve the current user's referral code:

```http
GET /referrals/code
```

Track a referral click or attribution. This endpoint may be called anonymously. Use a stable anonymous `sessionId` when the visitor is not logged in:

```http
POST /referrals/track
```

Request:

```json
{
  "referralCode": "ABC1234567",
  "courseId": "COURSE_ID",
  "sessionId": "browser-session-id"
}
```

Tracking does not award money. It stays pending until the referred user completes a successful backend-verified Kora payment.

Referral history:

```http
GET /referrals/history?page=1&limit=20
```

Referral withdrawals are not enabled. Treat the balance as read-only until a payout system is added.

## Quizzes

### Get quiz

```http
GET /quizzes/:quizId
```

Correct answers are not returned in the public quiz payload.

### Start attempt

```http
POST /quizzes/:quizId/attempts
```

### Submit attempt

```http
POST /quizzes/attempts/:attemptId/submit
```

Request:

```json
{
  "answers": [
    {
      "questionId": "QUESTION_ID",
      "answer": "selected-answer"
    }
  ]
}
```

Quiz scoring is performed by the backend.

## Instructor Course Management

Instructor-only endpoints:

```http
GET /courses/instructor/me
POST /courses
PUT /courses/:courseId
DELETE /courses/:courseId
POST /courses/:courseId/submit
POST /courses/:courseId/sections
POST /courses/:courseId/sections/:sectionId/lessons
POST /quizzes/courses/:courseId
POST /media/upload
```

Course workflow:

```text
DRAFT -> PENDING_REVIEW -> APPROVED -> PUBLISHED
                         -> REJECTED -> DRAFT
```

Instructors cannot approve their own courses. Only approved courses can be published publicly.

### Create course request

```json
{
  "title": "Complete React Course",
  "shortDescription": "Learn React from the ground up.",
  "description": "Full course description.",
  "category": "CATEGORY_ID",
  "level": "Beginner",
  "language": "English",
  "price": 50000,
  "originalPrice": 75000,
  "thumbnail": {
    "url": "CLOUDINARY_URL",
    "publicId": "CLOUDINARY_PUBLIC_ID"
  },
  "learningOutcomes": ["Build React apps"],
  "requirements": ["Basic JavaScript"],
  "prerequisites": []
}
```

### Upload media

Use multipart form data:

```text
POST /media/upload
field: file
field: resourceType=auto|image|video|raw
```

The response contains the Cloudinary URL and public ID. Store those values in the course or lesson data.

## Admin APIs

Only authenticated `admin` users may call these endpoints:

```http
GET /admin/analytics
GET /admin/users
PATCH /admin/users/:userId/status
GET /admin/courses
POST /admin/courses/:courseId/review
PATCH /admin/courses/:courseId/publication
GET /admin/payments
GET /admin/reviews
GET /admin/certificates
GET /admin/categories
POST /admin/notifications
```

Admin course review request:

```json
{
  "approved": true
}
```

Rejection request:

```json
{
  "approved": false,
  "rejectionReason": "Please improve the course curriculum."
}
```

Do not show admin navigation to students or instructors.

## API Client Requirements

Create a centralized client with:

- Base URL from the frontend environment variable
- JSON request headers
- Bearer token injection
- Request timeout
- Standard response parsing
- Standard error parsing
- 401 handling
- Optional retry only for safe GET requests

Suggested API client behavior:

```javascript
const apiRequest = async (path, options = {}) => {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const error = new Error(body.message || "Request failed");
    error.code = body.error?.code;
    error.status = response.status;
    throw error;
  }
  return body;
};
```

For file uploads, do not manually set `Content-Type`; let the browser set the multipart boundary.

## Frontend Integration Checklist

Implement and verify these flows in order:

1. Configure the API base URL.
2. Connect registration.
3. Connect login and persist the JWT.
4. Connect email verification and resend verification.
5. Connect forgot/reset password.
6. Load featured and trending courses from the API.
7. Load course detail pages from `/courses/:slug`.
8. Connect course search, filters, and sorting.
9. Connect cart add/remove/list/clear.
10. Connect Kora payment initialization and redirect.
11. Verify Kora payment through the backend callback flow.
12. Connect free enrollment.
13. Connect student enrollments and progress.
14. Connect wishlist.
15. Connect reviews and ratings.
17. Connect referrals: code, tracking, summary, history, and payment attribution.
18. Connect certificates and notifications.
19. Connect instructor course management and approval status.
20. Connect admin-only screens only where they exist in the frontend.
21. Add loading, empty, unauthorized, forbidden, payment-pending, payment-failed, and server-error states.
22. Test desktop and mobile behavior after integration.

## Important Limitations

- The backend does not provide frontend code or static mock data automatically.
- Kora payment testing requires valid backend Kora credentials and a public webhook URL.
- Email delivery requires Brevo configuration.
- Course media upload requires Cloudinary configuration.
- Admin accounts must be created/assigned securely by the backend owner.
- Do not claim an integration is complete until the request is tested against the deployed API.

## Final Deliverable From This Task

After implementing the integration, report:

- Files changed
- API client location
- Environment variable added
- Frontend routes connected
- Authentication flows tested
- Course flows tested
- Cart/wishlist flows tested
- Payment callback and verification tested
- Any backend or external-service blockers
- Any remaining mock data

Start by inspecting the existing frontend and then implement the integration incrementally. Do not wait for additional approval between normal integration steps.
