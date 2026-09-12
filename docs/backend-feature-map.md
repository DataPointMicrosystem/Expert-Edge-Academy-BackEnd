# Backend Feature Map - ExpertEdge Academy

**Date**: September 12, 2026  
**Version**: 1.0  
**Status**: Pre-Implementation Architecture

---

## EXISTING IMPLEMENTATION (Already in Codebase)

### ✅ Authentication System

- User registration (email/password)
- User login (email/password)
- Google OAuth via Passport.js
- Password reset via OTP (email-based)
- JWT token generation
- Basic auth middleware

### ✅ Infrastructure

- Express.js application setup
- MongoDB connection
- Brevo email service integration
- Passport.js OAuth setup
- Environment variables (.env)

### ✅ Dependencies Already Installed

- Express, Mongoose, JWT, Bcrypt
- Passport.js, Google OAuth
- Express-validator, Joi
- Brevo email service
- Cloudinary (for media)
- Express-fileupload
- CORS, Morgan, Session

---

## REQUIRED BACKEND MODULES

Based on product decisions and frontend audit, the backend requires:

### Module 1: Authentication & Users

**Status**: Partially Done (Needs Extension)

- ✅ Email/password signup
- ✅ Email/password login
- ✅ Google OAuth
- ❌ Email verification
- ❌ GitHub OAuth
- ❌ User role differentiation (student/instructor/admin)
- ❌ Profile updates
- ❌ User suspension/deactivation

### Module 2: Courses

**Status**: Not Started

- Course CRUD (Create, Read, Update, Delete)
- Course publishing/unpublishing
- Course sections and lectures
- Course thumbnails and media
- Course pricing and discounts
- Course metadata (level, language, duration, etc.)
- Course search and filtering
- Course categories
- Featured/trending courses
- Course status (draft, pending approval, published, archived)
- Instructor ownership and permissions

### Module 3: Enrollments

**Status**: Not Started

- Enroll students in courses
- Manage enrollments
- Free course enrollment
- Paid course enrollment (with payment verification)
- Prevent duplicate enrollments
- Track enrollment status
- Enrollment history

### Module 4: Progress Tracking

**Status**: Not Started

- Track lesson completion
- Track section completion
- Track overall course progress
- Calculate progress percentage
- Track last accessed lesson
- Allow resume from last position

### Module 5: Payments

**Status**: Not Started

- Payment initiation
- Payment verification
- Payment status tracking
- Order creation
- Transaction history
- Revenue tracking for instructors
- Discount and pricing management
- Payment provider abstraction

### Module 6: Quizzes & Assessments

**Status**: Not Started

- Create quizzes
- Create quiz questions
- Quiz submission
- Quiz scoring
- Quiz attempts tracking
- Quiz results history
- Question types (multiple choice, essay, etc.)

### Module 7: Reviews & Ratings

**Status**: Not Started

- Submit course reviews
- Submit course ratings
- List course reviews
- Average rating calculation
- Prevent duplicate reviews
- Delete reviews (by admin/moderator)
- Review moderation

### Module 8: Certificates

**Status**: Not Started

- Generate certificates on course completion
- Store certificate data
- Download certificates
- Certificate verification
- Certificate templates

### Module 9: Wishlist

**Status**: Not Started

- Add course to wishlist
- Remove course from wishlist
- View wishlist
- Move to cart from wishlist

### Module 10: Shopping Cart

**Status**: Not Started

- Add course to cart
- Remove course from cart
- View cart
- Cart persistence
- Clear cart after purchase

### Module 11: Instructor Dashboard

**Status**: Not Started

- View instructor statistics
  - Total students
  - Course enrollments
  - Course completion rate
  - Average rating
  - Total revenue
  - Course views
- Manage own courses
- Manage course content
- View analytics
- Upload course materials

### Module 12: Admin Dashboard

**Status**: Not Started

- User management (view, suspend, delete)
- Instructor management and approval
- Course management and approval
- Category management
- Review and rating moderation
- Payment and transaction tracking
- Platform analytics
- Featured course management
- Notification management

### Module 13: Notifications

**Status**: Not Started

- Email notifications
- In-app notifications
- Notification preferences
- Notification history
- Support for multiple event types:
  - Email verification
  - Password reset
  - Course enrollment
  - Payment success/failure
  - Course approval/rejection
  - Course updates
  - Quiz completion
  - Certificate availability
  - Admin announcements

### Module 14: Search & Filtering

**Status**: Not Started

- Full-text course search
- Filter by category
- Filter by level
- Filter by price range
- Filter by rating
- Filter by instructor
- Sort by (popularity, price, rating, newest)

### Module 15: Media Management

**Status**: Not Started

- Upload course thumbnails
- Upload course videos
- Upload course resources/attachments
- Delete media
- File type and size validation
- Cloudinary integration for secure uploads

### Module 16: Roles & Permissions

**Status**: Not Started

- Define role-based access control (RBAC)
- Student role permissions
- Instructor role permissions
- Admin role permissions
- Enforce permissions at API level

---

## EXISTING TECH STACK

| Component        | Technology             | Version       |
| ---------------- | ---------------------- | ------------- |
| Runtime          | Node.js                | -             |
| Framework        | Express.js             | 5.2.1         |
| Database         | MongoDB                | -             |
| ODM              | Mongoose               | 9.9.4         |
| Authentication   | JWT                    | 9.0.3         |
| Password Hashing | Bcrypt                 | 6.0.0         |
| OAuth            | Passport.js            | -             |
| Email Service    | Brevo                  | 3.0.1         |
| File Upload      | Express-fileupload     | 1.5.2         |
| Media Storage    | Cloudinary             | 2.11.0        |
| Validation       | Joi, Express-validator | 18.2.5, 7.3.2 |
| Logging          | Morgan                 | 1.12.0        |
| Sessions         | Express-session        | 1.19.0        |
| CORS             | CORS                   | 2.8.6         |
| Environment      | Dotenv                 | 17.4.2        |

---

## ARCHITECTURE DECISIONS

### 1. Modular Structure

```
backend/
├── models/              (Database schemas)
├── controllers/         (Business logic)
├── routes/              (API endpoints)
├── middleware/          (Authentication, authorization, validation)
├── services/            (Business logic reusable functions)
├── utils/               (Helpers, email templates, constants)
├── validators/          (Input validation)
├── config/              (Configuration files)
└── docs/                (Documentation)
```

### 2. Authentication Strategy

- JWT-based stateless authentication
- Role-based access control (RBAC)
- Middleware for protecting routes
- Separate middleware for authorization by role

### 3. Error Handling

- Consistent error response format
- Proper HTTP status codes
- Error logging
- User-friendly error messages

### 4. Payment Integration

- Payment provider abstraction layer
- Payment status verification before enrollment
- Idempotency for payment processing
- No tight coupling with specific payment provider

### 5. Email Notifications

- Brevo email service
- Email templates for different events
- Async email sending to prevent blocking
- Email queue for reliability

### 6. Media Management

- Cloudinary for image and video hosting
- File type and size validation
- Secure upload (not exposed to frontend)
- Cleanup of deleted media

---

## SUMMARY OF FEATURES TO IMPLEMENT

| Feature                  | Module        | Priority | Complexity |
| ------------------------ | ------------- | -------- | ---------- |
| Email verification       | Auth          | High     | Low        |
| GitHub OAuth             | Auth          | Medium   | Low        |
| User profiles            | Users         | High     | Medium     |
| User suspension          | Users/Admin   | Medium   | Low        |
| Course CRUD              | Courses       | High     | High       |
| Course approval workflow | Courses/Admin | High     | Medium     |
| Search & filtering       | Courses       | High     | High       |
| Enrollments              | Enrollments   | High     | Medium     |
| Free course enrollment   | Enrollments   | High     | Low        |
| Paid course enrollment   | Enrollments   | High     | High       |
| Progress tracking        | Progress      | High     | Medium     |
| Payment integration      | Payments      | High     | High       |
| Quizzes                  | Quizzes       | Medium   | High       |
| Reviews & ratings        | Reviews       | High     | Medium     |
| Certificates             | Certificates  | Medium   | High       |
| Wishlist                 | Wishlist      | Medium   | Low        |
| Shopping cart            | Cart          | High     | Medium     |
| Instructor dashboard     | Dashboard     | High     | High       |
| Admin dashboard          | Dashboard     | High     | High       |
| Notifications            | Notifications | High     | Medium     |
| RBAC middleware          | Security      | High     | Medium     |
| Media uploads            | Media         | High     | Medium     |

---

**Next**: Database schema design and API endpoint specifications will follow
