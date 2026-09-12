# Architecture Overview & Summary - ExpertEdge Academy Backend

**Date**: September 12, 2026  
**Status**: VALIDATED FOR IMPLEMENTATION  
**Version**: 1.1

## FINAL PRODUCT DECISIONS

- Kora is the initial payment provider behind a provider-agnostic payment service.
- Course approval workflow: `DRAFT -> PENDING_REVIEW -> APPROVED/PUBLISHED`, or `PENDING_REVIEW -> REJECTED`.
- Certificates are generated automatically after completion requirements are satisfied.
- MVP notifications support email and in-app delivery; the delivery interface leaves room for push notifications later.
- Platform commission is configurable and defaults to 15% through environment configuration.
- MVP analytics are summary-level and backed by counters and aggregate queries that can later support detailed event analytics.
- Courses may declare prerequisite courses; enrollment and course access validate them.

---

## EXECUTIVE SUMMARY

I have completed a comprehensive analysis and design for the ExpertEdge Academy backend system. This document summarizes the proposed architecture, which is ready for your approval before implementation begins.

**Total Documentation Created**:

- ✅ Frontend Feature Audit (docs/frontend-feature-audit.md)
- ✅ Backend Feature Map (docs/backend-feature-map.md)
- ✅ Database Schema Design (docs/database-design.md)
- ✅ API Architecture (docs/api-architecture.md)
- ✅ Implementation Plan (docs/implementation-plan.md)

---

## KEY FINDINGS FROM FRONTEND AUDIT

### Currently Implemented in Frontend

- ✅ Public landing page with course browsing
- ✅ Course detail pages
- ✅ User authentication (email/password, Google OAuth)
- ✅ Shopping cart interface
- ✅ "Become instructor" call-to-action
- ✅ Password reset flow

### NOT Yet Implemented (Correctly NOT built yet)

- ❌ Dashboard (student or instructor)
- ❌ Course player
- ❌ Search/filtering
- ❌ Admin panel
- ❌ User profiles
- ❌ Wishlist
- ❌ Payment checkout

---

## EXISTING BACKEND CODE STATUS

### ✅ Already Implemented (Reuse these)

- User registration (email/password)
- User login
- Google OAuth via Passport.js
- Password reset via OTP
- Brevo email service integration
- JWT token generation
- Basic auth middleware
- Express.js + MongoDB setup

### ❌ Needs Enhancement

- User model (missing fields for instructor/admin roles)
- Auth controller (needs email verification step)
- Error handling (inconsistent)
- Response format (not standardized)

---

## PROPOSED BACKEND ARCHITECTURE

### System Design Layers

```
┌─────────────────────────────────────────┐
│       API Routes & Request Handlers     │  ← Entry point for HTTP requests
├─────────────────────────────────────────┤
│  Middleware (Auth, Validation, Error)   │  ← Security & validation
├─────────────────────────────────────────┤
│       Controllers (Business Logic)      │  ← Route handlers
├─────────────────────────────────────────┤
│        Services (Reusable Logic)        │  ← Business rules
├─────────────────────────────────────────┤
│     Data Access Layer (Repositories)    │  ← Direct DB access
├─────────────────────────────────────────┤
│     Mongoose Models (Data Schemas)      │  ← Database schemas
├─────────────────────────────────────────┤
│         MongoDB (Persistent Data)       │  ← Database
└─────────────────────────────────────────┘
```

### Module Organization

The backend is organized into 14 independent modules:

```
┌──────────────────────────────────────────────────────────────┐
│                      EXPERTEDGE ACADEMY BACKEND                │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │    AUTH     │  │    USERS    │  │  CATEGORIES │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   COURSES   │  │ ENROLLMENTS │  │    CART     │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  PAYMENTS   │  │   QUIZZES   │  │   REVIEWS   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  WISHLIST   │  │ CERTIFICATES│  │NOTIFICATIONS           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              ADMIN MODULE (Manage All)                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│  SHARED INFRASTRUCTURE                                         │
│  - Authentication & Authorization Middleware                  │
│  - Error Handling & Response Formatting                       │
│  - Input Validation & Sanitization                            │
│  - Rate Limiting & Security Headers                           │
│  - Email Service (Brevo)                                      │
│  - Media Management (Cloudinary)                              │
│  - Payment Provider Abstraction                               │
│  - Analytics & Audit Logging                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## DATABASE DESIGN

### Collection Validation

The original 18 collections are justified by the approved full product, but they are not all required before the first MVP slice is usable. Implementation is staged as follows:

**Core MVP collections (14)**: `users`, `profiles`, `categories`, `courses`, `sections`, `lessons`, `enrollments`, `lesson_progress`, `payments`, `reviews`, `cart_items`, `wishlist_items`, `notifications`, and `admin_actions`.

**Feature collections (4)**: `quizzes`, `questions`, `quiz_attempts`, and `certificates`. These are required by the approved product, but are introduced with their corresponding learning and completion workflows rather than as empty infrastructure.

This is not a duplicate-collection design: sections and lessons are separate because instructors manage them independently; cart and wishlist are separate because they have different lifecycle and business rules; payment records are separate from enrollments so provider verification and financial history remain auditable.

### 18 Collections Proposed

| Collection      | Purpose               | Relationships                     |
| --------------- | --------------------- | --------------------------------- |
| users           | Core user accounts    | Primary entity                    |
| profiles        | Extended user info    | 1:1 with users                    |
| categories      | Course categories     | 1:N with courses                  |
| courses         | Course content        | N:M with enrollments              |
| sections        | Course sections       | 1:N with courses                  |
| lessons         | Individual lessons    | 1:N with sections                 |
| enrollments     | Student enrollments   | N:N between users & courses       |
| lesson_progress | Progress per lesson   | N:N between enrollments & lessons |
| quizzes         | Quiz definitions      | 1:N with courses                  |
| questions       | Quiz questions        | 1:N with quizzes                  |
| quiz_attempts   | Student quiz attempts | N:N between enrollments & quizzes |
| payments        | Transaction records   | 1:1 with enrollments              |
| reviews         | Course reviews        | N:M between users & courses       |
| certificates    | Completion certs      | 1:1 with enrollments              |
| cart_items      | Shopping cart items   | N:M between users & courses       |
| wishlist_items  | Favorited courses     | N:M between users & courses       |
| notifications   | User notifications    | N:N between users & events        |
| admin_actions   | Audit log             | N:1 with admins                   |

### Key Database Features

- ✅ Proper indexing for performance
- ✅ Unique constraints to prevent duplicates
- ✅ Foreign key references for relationships
- ✅ Denormalization where needed (e.g., course ratings)
- ✅ Timestamps on all records
- ✅ Status fields for workflows
- ✅ Prerequisite course references on courses
- ✅ Payment records independent from enrollment creation
- ✅ Summary analytics through indexed counters and aggregate queries

---

## API ARCHITECTURE

The documented endpoint inventory is a product-complete target, not a requirement to create every route immediately. Phase 1 implements authentication, users, and shared infrastructure; each later phase adds only the routes required by its completed workflow. No speculative route module is needed.

### 14 API Modules

```
GET  /api/                    - API health check
POST /api/auth/signup         - User registration
POST /api/auth/login          - User login
POST /api/auth/verify-email   - Email verification
POST /api/auth/forgot-password- Password reset request
POST /api/auth/reset-password - Password reset confirm

GET  /api/users/me            - Get current user
PUT  /api/users/profile       - Update profile
GET  /api/users/:userId       - Get public profile

GET  /api/categories          - List categories
POST /api/categories          - Create category (admin)

GET  /api/courses             - List courses (public)
GET  /api/courses/:slug       - Get course details (public)
POST /api/courses             - Create course (instructor)
PUT  /api/courses/:courseId   - Update course (instructor)
POST /api/courses/:courseId/publish - Submit for approval
GET  /api/courses/featured    - Featured courses
GET  /api/courses/trending    - Trending courses

POST /api/enrollments/:courseId      - Enroll in free course
GET  /api/enrollments/my-courses     - Student's courses
PUT  /api/enrollments/:enrollmentId/progress - Track progress

GET  /api/cart                - Get cart
POST /api/cart/add/:courseId  - Add course to cart
DELETE /api/cart/remove/:courseId - Remove from cart

POST /api/payments/initiate   - Start payment
POST /api/payments/verify/:ref- Verify payment & enroll

POST /api/quizzes/:quizId/attempt    - Start quiz
POST /api/quizzes/attempt/:attemptId/answer - Submit answer
POST /api/quizzes/attempt/:attemptId/submit - Submit quiz

POST /api/courses/:courseId/reviews - Submit review
GET  /api/courses/:courseId/reviews - List reviews
PUT  /api/reviews/:reviewId         - Update review
DELETE /api/reviews/:reviewId       - Delete review

GET  /api/wishlist            - Get wishlist
POST /api/wishlist/add/:courseId    - Add to wishlist
DELETE /api/wishlist/remove/:courseId - Remove from wishlist

GET  /api/certificates        - Get user certificates
GET  /api/certificates/:certId- Get certificate details
GET  /api/certificates/verify/:code - Verify certificate

GET  /api/notifications       - Get notifications
PUT  /api/notifications/:notifId - Mark as read

GET  /api/admin/analytics     - Platform analytics
POST /api/admin/courses/:courseId/approve - Approve course
POST /api/admin/users/:userId/suspend    - Suspend user
```

### Response Format (Consistent)

**Success**:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    /* response data */
  },
  "meta": {
    /* pagination if applicable */
  }
}
```

**Error**:

```json
{
  "success": false,
  "message": "User-friendly message",
  "error": {
    "code": "ERROR_CODE",
    "details": "Technical details"
  }
}
```

---

## AUTHENTICATION & AUTHORIZATION STRATEGY

### Authentication Methods

1. **Email/Password** - Traditional signup/login
2. **Email Verification** - OTP-based verification after signup
3. **Google OAuth** - Existing Passport.js integration
4. **GitHub OAuth** - New integration (Passport.js)
5. **JWT Tokens** - Stateless auth with 1-hour expiry

### Authorization (Role-Based Access Control)

| Role           | Can Do                                                                    | Cannot Do                                                    |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Student**    | View courses, enroll, take quizzes, review courses, buy courses           | Approve courses, manage users, edit other profiles           |
| **Instructor** | Create courses, manage own courses, view analytics, upload media          | Approve own courses, manage other instructors, view payments |
| **Admin**      | Approve courses, manage users, view platform analytics, manage categories | Cannot override instructor course ownership                  |

---

## SECURITY MEASURES

### Implemented

- ✅ JWT-based authentication
- ✅ Password hashing with Bcrypt
- ✅ Email verification via OTP
- ✅ Role-based access control
- ✅ Rate limiting on all endpoints
- ✅ CORS configuration
- ✅ Input validation & sanitization
- ✅ HTTPS enforcement (production)
- ✅ Security headers (Helmet)
- ✅ Error handling (no sensitive info leakage)
- ✅ Audit logging for admin actions

### External Services (Secure)

- **Email**: Brevo (API key in .env)
- **Media**: Cloudinary (API keys in .env, never exposed to frontend)
- **Payments**: Provider abstraction (credentials in .env)
- **OAuth**: Google & GitHub (credentials in .env)

---

## KEY ARCHITECTURAL DECISIONS

### 1. Modular Structure

Each module is independent with its own:

- Routes
- Controllers
- Services
- Validators
- Models

Benefits: Easy to test, maintain, and scale.

### 2. Service Layer

Business logic separated from route handlers.

Benefits: Reusability, testability, single responsibility.

### 3. Payment Abstraction

Payment logic decoupled from course/enrollment logic via a payment service interface.

Benefits: Can swap payment providers without changing core logic.

### 4. Notification Service

Event-driven notifications for important platform events.

Benefits: Users stay informed; system is loosely coupled.

### 5. Role-Based Authorization

Middleware checks permissions at API level, not in frontend.

Benefits: Security cannot be bypassed by frontend manipulation.

### 6. Cloudinary for Media

All files stored externally; server only stores URLs.

Benefits: Scalability, automatic CDN, easy cleanup.

---

## IMPLEMENTATION ROADMAP

### Phases

1. **Week 1**: Core infrastructure, auth, users, profiles
2. **Week 1-2**: Categories, courses, content management
3. **Week 2**: Enrollments, free courses, progress tracking
4. **Week 2-3**: Quizzes, shopping cart
5. **Week 3-4**: Payments, reviews, wishlist
6. **Week 4**: Certificates, notifications, instructor analytics
7. **Week 5**: Admin panel, search, security hardening, testing
8. **Week 5-6**: Documentation, deployment

### Estimated Timeline

- **Total Duration**: 6-7 weeks for complete implementation
- **Team Size**: 2-3 developers
- **Testing**: Continuous throughout, with dedicated testing phase

---

## CRITICAL SUCCESS FACTORS

✅ **Database Design Solid**

- 18 well-structured collections
- Proper relationships and constraints
- Performance indices planned

✅ **API Well-Defined**

- 100+ endpoints specified
- Clear request/response formats
- Standard error handling

✅ **Security Built-In**

- Authentication on all protected routes
- Authorization checked at API level
- Secrets in environment variables

✅ **Modular Architecture**

- Independent modules
- Reusable services
- Clear separation of concerns

✅ **Existing Code Preserved**

- Auth system being extended, not replaced
- Brevo integration reused
- Passport.js configuration kept

---

## ASSUMPTIONS & CLARIFICATIONS

**Assumption 1: Payment Provider**

- Backend is designed to support Kora initially and additional payment providers later.
- Specific provider can be configured via environment variables
- Implementation details depend on chosen provider

**Assumption 2: Admin Course Approval Workflow**

- Instructor creates course (status: "draft")
- Instructor publishes course (status: "pending_approval")
- Admin reviews and approves (status: "published")
- Until approved, course is not visible to students

**Assumption 3: Role Assignments**

- Students created on signup with "student" role
- Instructors created on signup with "instructor" role
- Admins assigned manually by system administrator

**Assumption 4: Email Verification**

- Required after signup before first login
- OTP valid for 10 minutes
- Can be resent multiple times

**Assumption 5: Enrollment Uniqueness**

- Student can only be enrolled once per course
- Attempting to enroll twice results in error
- Can re-enroll after course completion/dropping

---

## NEXT STEPS FOR APPROVAL

Please review the complete documentation:

1. **docs/frontend-feature-audit.md** - What frontend has
2. **docs/backend-feature-map.md** - What backend needs
3. **docs/database-design.md** - Database schemas with 18 collections
4. **docs/api-architecture.md** - Complete API specification (100+ endpoints)
5. **docs/implementation-plan.md** - Phase-by-phase implementation roadmap

### Questions to Consider

1. **Payment Provider**: Kora is selected for the initial integration; additional providers can be added later.
2. **Instructor Approval**: Should all instructor courses require admin approval before publishing?
3. **Certificate Generation**: Should certificates be auto-generated on completion or require admin approval?
4. **Notification Channels**: Should we support push notifications in addition to email and in-app?
5. **Analytics Granularity**: Do you want detailed analytics (views per lesson, quiz attempt distribution, etc.) or just summary stats?
6. **Instructor Revenue Split**: What's the platform fee? (Currently assumed 15%)
7. **Course Requirements**: Are "requirements/prerequisites" fixed text or should they link to other courses?

---

## APPROVAL CHECKLIST

**Please confirm**:

- [ ] Database design (18 collections) is acceptable
- [ ] API structure (14 modules, 100+ endpoints) is correct
- [ ] Authentication strategy (JWT + OTP + OAuth) works for you
- [ ] Authorization model (RBAC) is appropriate
- [ ] Payment abstraction approach works
- [ ] Implementation phases and timeline are realistic
- [ ] Project structure and modular design are suitable
- [ ] No major features or changes needed before implementation starts

---

## READY TO BEGIN IMPLEMENTATION

Once you approve the architecture above, I will:

1. Create all Mongoose models
2. Implement auth system with email verification
3. Build course management system
4. Implement enrollment and progress tracking
5. Setup payments and automatic enrollment
6. Implement quizzes, reviews, certificates
7. Build admin and instructor dashboards
8. Add comprehensive tests
9. Deploy and integrate with frontend

**This comprehensive backend will make the ExpertEdge Academy frontend fully functional without any mock data.**

---

**Status**: AWAITING APPROVAL TO PROCEED WITH IMPLEMENTATION
