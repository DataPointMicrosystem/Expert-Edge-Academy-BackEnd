# Implementation Plan - ExpertEdge Academy Backend

**Date**: September 12, 2026  
**Status**: Ready for Implementation  
**Version**: 1.0

---

## OVERVIEW

This document outlines the implementation strategy for building the ExpertEdge Academy backend system. The implementation follows a modular, incremental approach with clear phases.

---

## PROJECT STRUCTURE

```
backend/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── database.js         # MongoDB connection
│   │   ├── passport.js         # OAuth configuration (existing)
│   │   └── cloudinary.js       # Cloudinary setup
│   │
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js             # (update existing)
│   │   ├── Profile.js
│   │   ├── Course.js
│   │   ├── Section.js
│   │   ├── Lesson.js
│   │   ├── Enrollment.js
│   │   ├── LessonProgress.js
│   │   ├── Quiz.js
│   │   ├── Question.js
│   │   ├── QuizAttempt.js
│   │   ├── Payment.js
│   │   ├── Review.js
│   │   ├── Certificate.js
│   │   ├── Cart.js
│   │   ├── Wishlist.js
│   │   ├── Notification.js
│   │   ├── Category.js
│   │   └── AdminAction.js
│   │
│   ├── controllers/             # Route handlers
│   │   ├── authController.js   # (update existing)
│   │   ├── userController.js   # (update existing)
│   │   ├── courseController.js
│   │   ├── sectionController.js
│   │   ├── lessonController.js
│   │   ├── enrollmentController.js
│   │   ├── cartController.js
│   │   ├── paymentController.js
│   │   ├── quizController.js
│   │   ├── reviewController.js
│   │   ├── wishlistController.js
│   │   ├── certificateController.js
│   │   ├── notificationController.js
│   │   ├── categoryController.js
│   │   └── adminController.js
│   │
│   ├── routes/                  # API routes
│   │   ├── authRoutes.js       # (update existing)
│   │   ├── userRoutes.js
│   │   ├── courseRoutes.js
│   │   ├── enrollmentRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── quizRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── wishlistRoutes.js
│   │   ├── certificateRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── categoryRoutes.js
│   │   └── adminRoutes.js
│   │
│   ├── middleware/              # Custom middleware
│   │   ├── auth.js             # (update existing)
│   │   ├── authorization.js     # Role-based access control
│   │   ├── errorHandler.js
│   │   ├── validation.js
│   │   ├── rateLimiter.js
│   │   ├── passport.js         # (existing)
│   │   └── uploadHandler.js
│   │
│   ├── services/                # Business logic layer
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── courseService.js
│   │   ├── enrollmentService.js
│   │   ├── paymentService.js
│   │   ├── quizService.js
│   │   ├── reviewService.js
│   │   ├── certificateService.js
│   │   ├── notificationService.js
│   │   ├── analyticsService.js
│   │   └── emailService.js
│   │
│   ├── validators/              # Input validation schemas
│   │   ├── authValidators.js
│   │   ├── userValidators.js
│   │   ├── courseValidators.js
│   │   ├── enrollmentValidators.js
│   │   ├── paymentValidators.js
│   │   └── quizValidators.js
│   │
│   ├── utils/                   # Utility functions
│   │   ├── constants.js         # App-wide constants
│   │   ├── errorCodes.js        # Error code definitions
│   │   ├── emailTemplates.js    # (update existing)
│   │   ├── helpers.js           # Common helper functions
│   │   ├── pagination.js        # Pagination helper
│   │   ├── responses.js         # Standard response format
│   │   └── validators.js        # Validation helpers
│   │
│   ├── plugins/                 # Third-party integrations
│   │   ├── cloudinary.js        # File upload/media management
│   │   ├── brevo.js            # Email service (update existing)
│   │   └── paymentGateway.js    # Payment provider abstraction
│   │
│   └── app.js                   # Express app setup (update existing)
│
├── docs/
│   ├── frontend-feature-audit.md      # (created)
│   ├── backend-feature-map.md         # (created)
│   ├── database-design.md             # (created)
│   ├── api-architecture.md            # (created)
│   ├── implementation-plan.md         # (this file)
│   ├── swagger.yaml                   # OpenAPI specification
│   └── ARCHITECTURE.md                # System architecture overview
│
├── tests/
│   ├── unit/
│   │   ├── auth.test.js
│   │   ├── courses.test.js
│   │   ├── enrollments.test.js
│   │   └── payments.test.js
│   ├── integration/
│   │   └── api.test.js
│   └── fixtures/
│       └── testData.js
│
├── .env.example                 # Environment variables template
├── .env                        # (exists)
├── server.js                   # (update existing)
├── App.js                      # (update existing)
├── package.json                # (add new dependencies)
├── README.md                   # Project documentation
└── .gitignore                  # (ensure sensitive files ignored)
```

---

## IMPLEMENTATION PHASES

### PHASE 1: Core Infrastructure & Auth (Week 1)

**Goal**: Establish foundation and complete authentication system

**Tasks**:

- [ ] Update User model with all required fields
- [ ] Implement email verification with OTP
- [ ] Implement GitHub OAuth
- [ ] Create Profile model
- [ ] Update auth controller with email verification
- [ ] Create auth validators
- [ ] Create auth service
- [ ] Add rate limiting middleware
- [ ] Add CORS and security headers
- [ ] Setup error handling middleware
- [ ] Add standard response format middleware
- [ ] Create authentication tests

**Deliverable**: Complete, tested auth system with email verification

---

### PHASE 2: User Management & Profiles (Week 1)

**Goal**: User profile system with role differentiation

**Tasks**:

- [ ] Update User model for role-based fields
- [ ] Create user routes
- [ ] Create user controller
- [ ] Create user service
- [ ] Implement profile CRUD
- [ ] Implement role-based authorization middleware
- [ ] Create user validators
- [ ] Add profile picture upload to Cloudinary

**Deliverable**: Working user profile system

---

### PHASE 3: Categories & Courses (Week 1-2)

**Goal**: Core course management functionality

**Tasks**:

- [ ] Create Category model
- [ ] Create Course model with status workflow
- [ ] Create Section and Lesson models
- [ ] Create course controller
- [ ] Create section controller
- [ ] Create lesson controller
- [ ] Create course routes
- [ ] Create course validators
- [ ] Implement course CRUD (with instructor ownership)
- [ ] Implement course publishing workflow
- [ ] Setup Cloudinary integration for thumbnails and videos
- [ ] Create course search and filtering logic
- [ ] Implement instructor course management
- [ ] Add course tests

**Deliverable**: Instructors can create courses; users can browse and search

---

### PHASE 4: Enrollments & Free Courses (Week 2)

**Goal**: Student enrollment system for free courses

**Tasks**:

- [ ] Create Enrollment model
- [ ] Create LessonProgress model
- [ ] Create enrollment controller
- [ ] Create enrollment routes
- [ ] Implement free course enrollment
- [ ] Implement enrollment retrieval
- [ ] Implement progress tracking
- [ ] Implement lesson completion tracking
- [ ] Create dashboard data calculations
- [ ] Add enrollment tests

**Deliverable**: Students can enroll in free courses and track progress

---

### PHASE 5: Quizzes & Assessments (Week 2-3)

**Goal**: Quiz creation and attempt tracking

**Tasks**:

- [ ] Create Quiz, Question, QuizAttempt models
- [ ] Create quiz controller
- [ ] Create quiz routes
- [ ] Implement quiz creation
- [ ] Implement question management
- [ ] Implement quiz attempt logic
- [ ] Implement quiz submission and scoring
- [ ] Implement quiz results retrieval
- [ ] Add quiz tests

**Deliverable**: Instructors can create quizzes; students can attempt and score

---

### PHASE 6: Shopping Cart (Week 2)

**Goal**: Simple shopping cart for course collection

**Tasks**:

- [ ] Create Cart model
- [ ] Create cart controller
- [ ] Create cart routes
- [ ] Implement add to cart
- [ ] Implement remove from cart
- [ ] Implement get cart
- [ ] Implement clear cart
- [ ] Add duplicate enrollment check

**Deliverable**: Working shopping cart system

---

### PHASE 7: Payments & Enrollments (Week 3-4)

**Goal**: Payment processing and paid course enrollment

**Tasks**:

- [ ] Create Payment model
- [ ] Create payment controller
- [ ] Design payment provider abstraction
- [ ] Implement payment initiation
- [ ] Implement payment verification
- [ ] Implement enrollment on payment success
- [ ] Implement idempotency for payment processing
- [ ] Create payment routes
- [ ] Add error handling for payment failures
- [ ] Add payment tests

**Note**: Kora is the initial payment provider. Provider credentials and endpoints must be configured in `.env` so another provider can be added without changing course or enrollment logic.

**Deliverable**: Users can purchase courses; automatic enrollment on payment success

---

### PHASE 8: Reviews & Ratings (Week 3)

**Goal**: Course review system with rating calculation

**Tasks**:

- [ ] Create Review model
- [ ] Create review controller
- [ ] Create review routes
- [ ] Implement review submission
- [ ] Implement review updating/deletion
- [ ] Implement duplicate review prevention
- [ ] Implement rating calculation
- [ ] Implement review retrieval with pagination
- [ ] Add review moderation flag
- [ ] Add review tests

**Deliverable**: Enrolled students can review courses; ratings are calculated

---

### PHASE 9: Wishlist & Favorites (Week 3)

**Goal**: Course wishlist/favorites functionality

**Tasks**:

- [ ] Create Wishlist model
- [ ] Create wishlist controller
- [ ] Create wishlist routes
- [ ] Implement add to wishlist
- [ ] Implement remove from wishlist
- [ ] Implement get wishlist

**Deliverable**: Students can manage wishlist

---

### PHASE 10: Certificates (Week 4)

**Goal**: Certificate generation on course completion

**Tasks**:

- [ ] Create Certificate model
- [ ] Create certificate controller
- [ ] Create certificate routes
- [ ] Implement certificate generation on course completion
- [ ] Implement certificate verification
- [ ] Create certificate templates
- [ ] Add certificate download

**Deliverable**: Students get certificates on course completion

---

### PHASE 11: Notifications (Week 4)

**Goal**: Event-driven notification system

**Tasks**:

- [ ] Create Notification model
- [ ] Create notification service
- [ ] Create notification controller
- [ ] Create notification routes
- [ ] Implement email notifications (Brevo)
- [ ] Implement in-app notifications
- [ ] Setup event triggers for all major actions
- [ ] Implement notification preferences

**Deliverable**: Users receive notifications for important events

---

### PHASE 12: Instructor Dashboard & Analytics (Week 4)

**Goal**: Analytics and statistics for instructors

**Tasks**:

- [ ] Create analytics service
- [ ] Implement enrollment tracking
- [ ] Implement completion rate tracking
- [ ] Implement rating tracking
- [ ] Implement revenue tracking
- [ ] Implement course view tracking
- [ ] Create instructor dashboard endpoints
- [ ] Add analytics queries

**Deliverable**: Instructors can view course and earnings analytics

---

### PHASE 13: Admin Panel (Week 5)

**Goal**: Admin management capabilities

**Tasks**:

- [ ] Create admin controller
- [ ] Create admin routes
- [ ] Create AdminAction model (audit log)
- [ ] Implement user management endpoints
- [ ] Implement course approval workflow
- [ ] Implement user suspension
- [ ] Implement featured course management
- [ ] Implement platform analytics
- [ ] Implement review moderation
- [ ] Implement payment tracking
- [ ] Add admin tests

**Deliverable**: Admins can manage platform, courses, and users

---

### PHASE 14: Search & Advanced Filtering (Week 5)

**Goal**: Full-text search and complex filtering

**Tasks**:

- [ ] Create search service
- [ ] Implement MongoDB text indices
- [ ] Implement course search endpoint
- [ ] Implement filtering by category, level, price, rating
- [ ] Implement sorting options
- [ ] Implement pagination
- [ ] Add search tests

**Deliverable**: Advanced course discovery with search and filters

---

### PHASE 15: Security Hardening (Week 5)

**Goal**: Production-ready security

**Tasks**:

- [ ] Implement rate limiting on all endpoints
- [ ] Add request validation middleware
- [ ] Implement HTTPS enforcement
- [ ] Add helmet security headers
- [ ] Implement CORS properly
- [ ] Add input sanitization
- [ ] Implement DDoS protection
- [ ] Add security tests
- [ ] Review all error messages (no sensitive info leakage)

**Deliverable**: Production-ready security

---

### PHASE 16: API Documentation & Swagger (Week 5)

**Goal**: Complete API documentation

**Tasks**:

- [ ] Create Swagger/OpenAPI spec (swagger.yaml)
- [ ] Generate Swagger UI endpoint
- [ ] Document all endpoints
- [ ] Document all error responses
- [ ] Create API usage examples
- [ ] Create API change log
- [ ] Document environment variables

**Deliverable**: Complete, interactive API documentation

---

### PHASE 17: Testing (Week 5-6)

**Goal**: Comprehensive test coverage

**Tasks**:

- [ ] Write unit tests for all services
- [ ] Write integration tests for API endpoints
- [ ] Write authentication flow tests
- [ ] Write authorization tests
- [ ] Write payment flow tests
- [ ] Setup test database
- [ ] Setup test fixtures
- [ ] Achieve 80%+ code coverage

**Deliverable**: Well-tested, reliable backend

---

### PHASE 18: Frontend Integration & Deployment (Week 6)

**Goal**: Connect backend to frontend and deploy

**Tasks**:

- [ ] Test backend with frontend
- [ ] Fix any integration issues
- [ ] Setup production database
- [ ] Setup production Cloudinary account
- [ ] Setup production payment provider
- [ ] Setup production email service
- [ ] Deploy to production server
- [ ] Setup monitoring and logging
- [ ] Create deployment documentation

**Deliverable**: Live, integrated system

---

## TECHNOLOGY DECISIONS

### 1. Modular Architecture

- Separation of concerns: Routes → Controllers → Services → Models
- Easy to test and maintain
- Reusable services across endpoints

### 2. Authentication Strategy

- JWT for stateless auth
- OTP for email verification
- Role-based access control (RBAC)
- OAuth2 for social login

### 3. Payment Abstraction

- Payment service decoupled from course logic
- Provider agnostic (can swap providers easily)
- Webhook handling for async confirmations

### 4. Notification System

- Event-driven architecture
- Separate notification service
- Support for multiple channels (email, in-app)
- Async processing to prevent blocking

### 5. File Management

- Cloudinary for all media storage
- Never store files on server
- Secure upload (backend validation)
- Easy cleanup of deleted content

### 6. Database

- MongoDB for flexibility
- Mongoose for schema validation
- Proper indexing for performance
- Data denormalization where needed (e.g., course ratings)

---

## ENVIRONMENT VARIABLES

```bash
# Server
PORT=1023
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRY=1h

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:1023/api/auth/google/callback
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:1023/api/auth/github/callback

# Brevo (Email)
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=noreply@expertedgeacademy.com

# Cloudinary (Media)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Payment Provider (e.g., Stripe)
PAYMENT_PROVIDER=stripe
STRIPE_PUBLIC_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Frontend URLs
FRONTEND_URL=https://expertedgeacademy.vercel.app
FRONTEND_LOGIN_URL=https://expertedgeacademy.vercel.app/login
FRONTEND_FORGOT_PASSWORD_URL=https://expertedgeacademy.vercel.app/forgot-password

# Admin Settings
ADMIN_EMAIL=admin@expertedgeacademy.com
PLATFORM_FEE_PERCENTAGE=15
```

---

## CRITICAL CHECKLIST BEFORE GOING LIVE

- [ ] All authentication flows tested
- [ ] Email verification working
- [ ] Password reset working
- [ ] OAuth working
- [ ] All endpoints have rate limiting
- [ ] All endpoints have proper authorization
- [ ] All inputs validated
- [ ] Error messages don't leak sensitive info
- [ ] CORS configured correctly
- [ ] HTTPS enforced
- [ ] Security headers added
- [ ] Database backups configured
- [ ] Monitoring and logging setup
- [ ] Payment provider tested in sandbox
- [ ] Cloudinary working properly
- [ ] Email service working
- [ ] Admin panel tested
- [ ] Course approval workflow tested
- [ ] Payment flow end-to-end tested
- [ ] Enrollment flow tested
- [ ] Progress tracking tested
- [ ] API documentation complete
- [ ] README updated

---

## SUCCESS CRITERIA

1. **Authentication**: Users can signup, verify email, login, reset password
2. **Courses**: Instructors can create/manage courses; users can browse/search/view details
3. **Enrollments**: Students can enroll in free courses and track progress
4. **Payments**: Students can purchase courses and get automatically enrolled
5. **Quizzes**: Instructors can create quizzes; students can take and score them
6. **Reviews**: Students can review courses; ratings are calculated
7. **Admin**: Admins can approve courses and manage users
8. **Dashboards**: Students, instructors, and admins have working dashboards
9. **Notifications**: Users receive email and in-app notifications
10. **Security**: All endpoints properly secured with auth and validation

---

**End of Implementation Plan**
