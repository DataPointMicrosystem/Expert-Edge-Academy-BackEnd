# API Architecture - ExpertEdge Academy

**Date**: September 12, 2026  
**Status**: Pre-Implementation  
**Version**: 1.1  
**Protocol**: RESTful JSON API

## APPROVED PAYMENT DESIGN

Kora is the initial provider behind a provider-agnostic payment service. The server creates pending payment records, initializes Kora using `KORA_SECRET_KEY`, verifies the transaction server-side, and only then creates an enrollment. Pending, failed, and abandoned transactions never grant course access. The configurable `PLATFORM_FEE_PERCENTAGE` defaults to 15% and is stored with each successful payment.

---

## API BASE URL

**Development**: `http://localhost:1023/api`  
**Production**: `https://api.expertedgeacademy.com/api`

---

## AUTHENTICATION

### Authentication Method: JWT (Bearer Token)

**Token Format**:

```
Authorization: Bearer <JWT_TOKEN>
```

**Token Payload**:

```javascript
{
  userId: ObjectId,
  email: string,
  role: "student" | "instructor" | "admin",
  iat: timestamp,
  exp: timestamp
}
```

**Token Expiry**: 1 hour  
**Refresh Strategy**: Frontend requests a new token on login or via refresh endpoint

Authentication middleware only validates the token and resolves the user identity. Separate authorization middleware enforces role permissions and resource ownership.

---

## RESPONSE FORMAT

### Success Response

```javascript
{
  success: true,
  message: "Operation successful",
  data: { /* response data */ },
  meta: { /* optional pagination info */ }
}
```

### Error Response

```javascript
{
  success: false,
  message: "User-friendly error message",
  error: {
    code: "ERROR_CODE",
    details: "Technical details"
  }
}
```

---

## API MODULES & ENDPOINTS

## REFERRALS

```text
GET  /api/referrals/me       - Authenticated referral summary
GET  /api/referrals/code     - Generate or retrieve referral code
POST /api/referrals/track    - Track pending referral attribution
GET  /api/referrals/history  - Authenticated reward history
POST /api/referrals/withdraw - Returns 501 until payouts are implemented
```

Referral rewards are created only after successful server-side payment verification. The unique payment index on referral rewards prevents duplicate rewards from repeated verification or webhook delivery.

---

## MODULE 1: AUTHENTICATION

### Base Route: `/api/auth`

#### 1.1 Sign Up (Email/Password)

```
POST /api/auth/signup
Public
```

**Request Body**:

```javascript
{
  fullName: string (required),
  email: string (required, valid email),
  password: string (required, min 8 chars),
  role: "student" | "instructor" (required)
}
```

**Response (201)**:

```javascript
{
  success: true,
  data: {
    userId: ObjectId,
    email: string,
    fullName: string,
    role: string,
    message: "Sign up successful. Please verify your email."
  }
}
```

**Errors**: Email already exists, validation failed

---

#### 1.2 Login (Email/Password)

```
POST /api/auth/login
Public
```

**Request Body**:

```javascript
{
  email: string (required),
  password: string (required)
}
```

**Response (200)**:

```javascript
{
  success: true,
  data: {
    token: string,
    user: {
      userId: ObjectId,
      email: string,
      fullName: string,
      role: string,
      isVerified: boolean,
      avatar: string (optional)
    }
  }
}
```

**Errors**: User not found, invalid password, user not verified

---

#### 1.3 Verify Email (OTP)

```
POST /api/auth/verify-email
Public
```

**Request Body**:

```javascript
{
  email: string (required),
  otp: string (required, 6 digits)
}
```

**Response (200)**:

```javascript
{
  success: true,
  message: "Email verified successfully"
}
```

**Errors**: Invalid OTP, OTP expired, email already verified

---

#### 1.4 Resend Verification OTP

```
POST /api/auth/resend-otp
Public
```

**Request Body**:

```javascript
{
  email: string(required);
}
```

**Response (200)**:

```javascript
{
  success: true,
  message: "OTP sent to your email"
}
```

---

#### 1.5 Forgot Password

```
POST /api/auth/forgot-password
Public
```

**Request Body**:

```javascript
{
  email: string(required);
}
```

**Response (200)**:

```javascript
{
  success: true,
  message: "Password reset link sent to your email"
}
```

---

#### 1.6 Reset Password

```
POST /api/auth/reset-password
Public
```

**Request Body**:

```javascript
{
  email: string (required),
  otp: string (required),
  newPassword: string (required, min 8 chars)
}
```

**Response (200)**:

```javascript
{
  success: true,
  message: "Password reset successfully"
}
```

---

#### 1.7 Google OAuth Callback

```
GET /api/auth/google/callback?code=GOOGLE_AUTH_CODE
Public
```

**Response (200)**: Redirects with token and user data

---

#### 1.8 GitHub OAuth Callback

```
GET /api/auth/github/callback?code=GITHUB_AUTH_CODE
Public
```

**Response (200)**: Redirects with token and user data

---

#### 1.9 Logout

```
POST /api/auth/logout
Protected (Any role)
```

**Response (200)**:

```javascript
{
  success: true,
  message: "Logged out successfully"
}
```

---

## MODULE 2: USERS

### Base Route: `/api/users`

#### 2.1 Get Current User Profile

```
GET /api/users/me
Protected (Any role)
```

**Response (200)**:

```javascript
{
  success: true,
  data: {
    userId: ObjectId,
    email: string,
    fullName: string,
    role: string,
    avatar: string,
    isVerified: boolean,
    profile: {
      bio: string,
      phone: string,
      dateOfBirth: date,
      country: string,
      // instructor-specific
      expertise: [string],
      experience: number,
      rating: number,
      studentCount: number,
      courseCount: number,
      totalEarnings: number
    }
  }
}
```

---

#### 2.2 Update User Profile

```
PUT /api/users/profile
Protected (Any role)
```

**Request Body**:

```javascript
{
  fullName: string (optional),
  bio: string (optional),
  phone: string (optional),
  dateOfBirth: date (optional),
  country: string (optional),
  avatar: string (optional, URL),
  // Instructor fields
  expertise: [string] (optional, for instructors),
  experience: number (optional, for instructors)
}
```

**Response (200)**: Updated user profile

---

#### 2.3 Change Password

```
PUT /api/users/change-password
Protected (Any role)
```

**Request Body**:

```javascript
{
  currentPassword: string (required),
  newPassword: string (required, min 8 chars)
}
```

**Response (200)**:

```javascript
{
  success: true,
  message: "Password changed successfully"
}
```

---

#### 2.4 Get User Profile (Public)

```
GET /api/users/:userId
Public
```

**Response (200)**: Public user profile (limited info for instructors)

---

#### 2.5 Deactivate Account

```
POST /api/users/deactivate
Protected (Any role)
```

**Request Body**:

```javascript
{
  password: string(required);
}
```

**Response (200)**:

```javascript
{
  success: true,
  message: "Account deactivated"
}
```

---

## MODULE 3: COURSES

### Base Route: `/api/courses`

#### 3.1 Create Course

```
POST /api/courses
Protected (Instructor role required)
```

**Request Body**:

```javascript
{
  title: string (required),
  shortDescription: string (required),
  description: string (required),
  category: ObjectId (ref: categories, required),
  level: string (required),
  language: string (optional, default: English),
  thumbnail: string (Cloudinary URL, required),
  price: number (default: 0),
  originalPrice: number (optional),
  learningOutcomes: [string],
  requirements: [string]
}
```

**Response (201)**:

```javascript
{
  success: true,
  data: {
    courseId: ObjectId,
    title: string,
    slug: string,
    status: "draft",
    instructor: ObjectId
  }
}
```

---

#### 3.2 Get Course Details (Public)

```
GET /api/courses/:slug
Public
```

**Response (200)**:

```javascript
{
  success: true,
  data: {
    courseId: ObjectId,
    title: string,
    slug: string,
    description: string,
    shortDescription: string,
    price: number,
    originalPrice: number,
    discountPercentage: number,
    level: string,
    language: string,
    rating: number,
    reviewCount: number,
    enrollmentCount: number,
    thumbnail: string,
    learningOutcomes: [string],
    requirements: [string],

    instructor: {
      instructorId: ObjectId,
      fullName: string,
      avatar: string,
      bio: string,
      rating: number,
      studentCount: number,
      courseCount: number
    },

    sections: [{
      sectionId: ObjectId,
      title: string,
      order: number,
      lessons: [{
        lessonId: ObjectId,
        title: string,
        duration: number,
        isPreviewable: boolean
      }]
    }],

    status: string,
    isPublished: boolean,
    featured: boolean,
    trending: boolean,
    createdAt: date,
    updatedAt: date
  }
}
```

---

#### 3.3 Update Course

```
PUT /api/courses/:courseId
Protected (Course instructor or admin)
```

**Request Body**: Same as create, all fields optional

**Response (200)**: Updated course object

---

#### 3.4 Delete Course

```
DELETE /api/courses/:courseId
Protected (Course instructor or admin)
```

**Response (200)**:

```javascript
{
  success: true,
  message: "Course deleted successfully"
}
```

---

#### 3.5 Publish Course

```
POST /api/courses/:courseId/publish
Protected (Course instructor)
```

**Response (200)**:

```javascript
{
  success: true,
  message: "Course submitted for approval",
  data: {
    courseId: ObjectId,
    status: "pending_approval"
  }
}
```

---

#### 3.6 Get Instructor's Courses

```
GET /api/courses/instructor/me
Protected (Instructor)
```

**Query Parameters**:

```
?status=draft,pending_approval,published,archived
?page=1
?limit=10
```

**Response (200)**: Paginated list of instructor's courses

---

#### 3.7 Search & Filter Courses

```
GET /api/courses
Public
```

**Query Parameters**:

```
?search=string (title or description)
?category=categoryId
?level=Beginner|Intermediate|Advanced|All Levels
?priceMin=number
?priceMax=number
?ratingMin=number (0-5)
?instructor=instructorId
?sort=popularity|newest|price_asc|price_desc|rating
?page=1
?limit=12
?featured=true|false
?trending=true|false
```

**Response (200)**: Paginated list of courses with meta

---

#### 3.8 Get Featured Courses

```
GET /api/courses/featured
Public
```

**Response (200)**:

```javascript
{
  success: true,
  data: [
    // Array of 6 featured courses
  ]
}
```

---

#### 3.9 Get Trending Courses

```
GET /api/courses/trending
Public
```

**Response (200)**:

```javascript
{
  success: true,
  data: [
    // Array of trending courses
  ]
}
```

---

## MODULE 4: COURSE SECTIONS & LESSONS

### Base Route: `/api/courses/:courseId/sections`

#### 4.1 Create Section

```
POST /api/courses/:courseId/sections
Protected (Course instructor or admin)
```

**Request Body**:

```javascript
{
  title: string (required),
  description: string (optional),
  order: number (required)
}
```

**Response (201)**:

```javascript
{
  success: true,
  data: {
    sectionId: ObjectId
  }
}
```

---

#### 4.2 Update Section

```
PUT /api/courses/:courseId/sections/:sectionId
Protected (Course instructor or admin)
```

---

#### 4.3 Delete Section

```
DELETE /api/courses/:courseId/sections/:sectionId
Protected (Course instructor or admin)
```

---

#### 4.4 Create Lesson

```
POST /api/courses/:courseId/sections/:sectionId/lessons
Protected (Course instructor or admin)
```

**Request Body**:

```javascript
{
  title: string (required),
  description: string (optional),
  type: "video" | "document" | "quiz" | "assignment",
  order: number (required),
  videoUrl: string (for video type),
  videoDuration: number (seconds),
  documentUrl: string (for document type),
  isPreviewable: boolean (default: false),
  resources: [{
    title: string,
    url: string
  }]
}
```

**Response (201)**: Created lesson object

---

#### 4.5 Update Lesson

```
PUT /api/courses/:courseId/sections/:sectionId/lessons/:lessonId
Protected (Course instructor or admin)
```

---

#### 4.6 Delete Lesson

```
DELETE /api/courses/:courseId/sections/:sectionId/lessons/:lessonId
Protected (Course instructor or admin)
```

---

## MODULE 5: ENROLLMENTS

### Base Route: `/api/enrollments`

#### 5.1 Get My Enrollments

```
GET /api/enrollments/my-courses
Protected (Student)
```

**Query Parameters**:

```
?status=active|completed|dropped
?page=1
?limit=10
```

**Response (200)**: Paginated list of enrolled courses with progress

---

#### 5.2 Enroll in Free Course

```
POST /api/enrollments/:courseId
Protected (Student)
```

**Response (201)**:

```javascript
{
  success: true,
  data: {
    enrollmentId: ObjectId,
    courseId: ObjectId,
    enrollmentType: "free",
    progressPercentage: 0
  }
}
```

**Errors**: Already enrolled, course not found, course not free

---

#### 5.3 Get Enrollment Details

```
GET /api/enrollments/:enrollmentId
Protected (Student who owns enrollment)
```

**Response (200)**: Enrollment object with course details and progress

---

#### 5.4 Update Lesson Progress

```
PUT /api/enrollments/:enrollmentId/progress
Protected (Student who owns enrollment)
```

**Request Body**:

```javascript
{
  lessonId: ObjectId (required),
  isCompleted: boolean,
  watchedDuration: number (for video)
}
```

**Response (200)**:

```javascript
{
  success: true,
  data: {
    enrollmentId: ObjectId,
    progressPercentage: number,
    completedLessons: number
  }
}
```

---

## MODULE 6: SHOPPING CART

### Base Route: `/api/cart`

#### 6.1 Get Cart

```
GET /api/cart
Protected (Authenticated user)
```

**Response (200)**:

```javascript
{
  success: true,
  data: {
    items: [{
      cartItemId: ObjectId,
      courseId: ObjectId,
      title: string,
      price: number,
      originalPrice: number,
      thumbnail: string
    }],
    totalItems: number,
    totalPrice: number,
    totalDiscount: number
  }
}
```

---

#### 6.2 Add Course to Cart

```
POST /api/cart/add/:courseId
Protected (Authenticated user)
```

**Response (201)**:

```javascript
{
  success: true,
  message: "Course added to cart",
  data: {
    totalItems: number,
    totalPrice: number
  }
}
```

**Errors**: Course already in cart, already enrolled

---

#### 6.3 Remove Course from Cart

```
DELETE /api/cart/remove/:courseId
Protected (Authenticated user)
```

**Response (200)**:

```javascript
{
  success: true,
  message: "Course removed from cart"
}
```

---

#### 6.4 Clear Cart

```
DELETE /api/cart/clear
Protected (Authenticated user)
```

**Response (200)**:

```javascript
{
  success: true,
  message: "Cart cleared"
}
```

---

## MODULE 7: PAYMENTS

### Base Route: `/api/payments`

#### 7.1 Initiate Payment

```
POST /api/payments/initiate
Protected (Student)
```

**Request Body**:

```javascript
{
  cartItems: [courseId1, courseId2, ...], // or single course
  paymentMethod: "card" | "bank_transfer", // depends on provider
  redirectUrl: string (frontend callback URL)
}
```

**Response (200)**:

```javascript
{
  success: true,
  data: {
    paymentId: ObjectId,
    amount: number,
    currency: "NGN",
    paymentLink: string, // redirect to payment provider
    reference: string,
    status: "pending"
  }
}
```

---

#### 7.2 Verify Payment

```
POST /api/payments/verify/:reference
Public (Callback from payment provider)
```

**Response (200)**:

```javascript
{
  success: true,
  data: {
    paymentId: ObjectId,
    status: "completed",
    enrollments: [ObjectId, ObjectId], // newly created enrollments
    message: "Payment successful. You are now enrolled in the courses."
  }
}
```

---

#### 7.3 Get Payment History

```
GET /api/payments/history
Protected (Student)
```

**Query Parameters**:

```
?status=pending|completed|failed
?page=1
?limit=10
```

**Response (200)**: Paginated list of payments

---

#### 7.4 Get Payment Details

```
GET /api/payments/:paymentId
Protected (Student who owns payment)
```

**Response (200)**: Payment object with course details

---

## MODULE 8: QUIZZES

### Base Route: `/api/quizzes`

#### 8.1 Create Quiz

```
POST /api/courses/:courseId/quizzes
Protected (Course instructor or admin)
```

**Request Body**:

```javascript
{
  title: string,
  description: string,
  lessonId: ObjectId (optional),
  passingScore: number (0-100),
  maxAttempts: number (optional, null = unlimited),
  duration: number (minutes, optional),
  shuffleQuestions: boolean
}
```

**Response (201)**: Quiz object

---

#### 8.2 Add Question to Quiz

```
POST /api/quizzes/:quizId/questions
Protected (Course instructor or admin)
```

**Request Body**:

```javascript
{
  title: string (question text),
  type: "multiple_choice" | "true_false" | "short_answer" | "essay",
  order: number,
  options: [{
    text: string,
    isCorrect: boolean
  }],
  correctAnswer: string (for non-multiple choice),
  points: number,
  explanation: string (optional)
}
```

**Response (201)**: Question object

---

#### 8.3 Start Quiz Attempt

```
POST /api/quizzes/:quizId/attempt
Protected (Enrolled student)
```

**Response (201)**:

```javascript
{
  success: true,
  data: {
    attemptId: ObjectId,
    quizId: ObjectId,
    attemptNumber: number,
    questions: [{
      questionId: ObjectId,
      title: string,
      type: string,
      options: [string] (for multiple choice),
      // answers not revealed yet
    }],
    duration: number (minutes, optional),
    startedAt: date
  }
}
```

---

#### 8.4 Submit Quiz Answer

```
POST /api/quizzes/attempt/:attemptId/answer
Protected (Student taking quiz)
```

**Request Body**:

```javascript
{
  questionId: ObjectId,
  answer: string | [string]
}
```

**Response (200)**:

```javascript
{
  success: true,
  message: "Answer recorded"
}
```

---

#### 8.5 Submit Quiz Attempt

```
POST /api/quizzes/attempt/:attemptId/submit
Protected (Student)
```

**Response (200)**:

```javascript
{
  success: true,
  data: {
    attemptId: ObjectId,
    totalQuestions: number,
    answeredQuestions: number,
    correctAnswers: number,
    score: number,
    percentage: number,
    passed: boolean,
    results: [{
      questionId: ObjectId,
      title: string,
      userAnswer: string,
      correctAnswer: string,
      isCorrect: boolean,
      points: number
    }]
  }
}
```

---

#### 8.6 Get Quiz Attempts

```
GET /api/quizzes/:quizId/attempts
Protected (Student or instructor)
```

**Response (200)**: List of attempts for the user

---

## MODULE 9: REVIEWS & RATINGS

### Base Route: `/api/reviews`

#### 9.1 Submit Course Review

```
POST /api/courses/:courseId/reviews
Protected (Enrolled student)
```

**Request Body**:

```javascript
{
  title: string (required),
  content: string (required),
  rating: number (1-5, required)
}
```

**Response (201)**:

```javascript
{
  success: true,
  data: {
    reviewId: ObjectId,
    courseId: ObjectId,
    rating: number
  }
}
```

**Errors**: Not enrolled, already reviewed

---

#### 9.2 Update Review

```
PUT /api/reviews/:reviewId
Protected (Review author)
```

**Request Body**: Same as submit

**Response (200)**: Updated review object

---

#### 9.3 Delete Review

```
DELETE /api/reviews/:reviewId
Protected (Review author or admin)
```

**Response (200)**:

```javascript
{
  success: true,
  message: "Review deleted"
}
```

---

#### 9.4 Get Course Reviews

```
GET /api/courses/:courseId/reviews
Public
```

**Query Parameters**:

```
?sort=newest|oldest|rating_high|rating_low|helpful
?page=1
?limit=10
```

**Response (200)**: Paginated reviews

---

#### 9.5 Mark Review Helpful

```
POST /api/reviews/:reviewId/helpful
Protected (Any user)
```

**Response (200)**: Helpful count updated

---

## MODULE 10: WISHLIST

### Base Route: `/api/wishlist`

#### 10.1 Get Wishlist

```
GET /api/wishlist
Protected (Student)
```

**Response (200)**:

```javascript
{
  success: true,
  data: {
    items: [{
      wishlistId: ObjectId,
      courseId: ObjectId,
      title: string,
      price: number,
      thumbnail: string
    }],
    totalItems: number
  }
}
```

---

#### 10.2 Add Course to Wishlist

```
POST /api/wishlist/add/:courseId
Protected (Student)
```

**Response (201)**:

```javascript
{
  success: true,
  message: "Course added to wishlist"
}
```

---

#### 10.3 Remove from Wishlist

```
DELETE /api/wishlist/remove/:courseId
Protected (Student)
```

**Response (200)**:

```javascript
{
  success: true,
  message: "Course removed from wishlist"
}
```

---

## MODULE 11: CERTIFICATES

### Base Route: `/api/certificates`

#### 11.1 Get User Certificates

```
GET /api/certificates
Protected (Any user)
```

**Response (200)**: List of issued certificates

---

#### 11.2 Get Certificate Details

```
GET /api/certificates/:certificateId
Protected (Certificate owner or public verification)
```

**Response (200)**: Certificate details with verification link

---

#### 11.3 Verify Certificate

```
GET /api/certificates/verify/:verificationCode
Public
```

**Response (200)**: Certificate validation status

---

## MODULE 12: CATEGORIES

### Base Route: `/api/categories`

#### 12.1 Get All Categories

```
GET /api/categories
Public
```

**Response (200)**:

```javascript
{
  success: true,
  data: [{
    categoryId: ObjectId,
    name: string,
    slug: string,
    icon: string,
    courseCount: number
  }]
}
```

---

#### 12.2 Create Category

```
POST /api/categories
Protected (Admin only)
```

**Request Body**:

```javascript
{
  name: string,
  slug: string,
  description: string,
  icon: string
}
```

---

## MODULE 13: NOTIFICATIONS

### Base Route: `/api/notifications`

#### 13.1 Get User Notifications

```
GET /api/notifications
Protected (Any user)
```

**Query Parameters**:

```
?unread=true|false
?type=string
?page=1
?limit=20
```

**Response (200)**: Paginated notifications

---

#### 13.2 Mark as Read

```
PUT /api/notifications/:notificationId
Protected (Notification owner)
```

**Response (200)**:

```javascript
{
  success: true,
  message: "Notification marked as read"
}
```

---

#### 13.3 Mark All as Read

```
PUT /api/notifications/read-all
Protected (Any user)
```

**Response (200)**: All notifications marked as read

---

## MODULE 14: ADMIN

### Base Route: `/api/admin`

#### 14.1 Get Platform Analytics

```
GET /api/admin/analytics
Protected (Admin only)
```

**Response (200)**:

```javascript
{
  success: true,
  data: {
    totalUsers: number,
    totalInstructors: number,
    totalCourses: number,
    totalEnrollments: number,
    totalRevenue: number,
    averageRating: number
  }
}
```

---

#### 14.2 Approve/Reject Course

```
POST /api/admin/courses/:courseId/approve
Protected (Admin only)
```

**Request Body**:

```javascript
{
  approved: boolean,
  rejectionReason: string (if not approved)
}
```

**Response (200)**:

```javascript
{
  success: true,
  message: "Course approved/rejected"
}
```

---

#### 14.3 Suspend User

```
POST /api/admin/users/:userId/suspend
Protected (Admin only)
```

**Request Body**:

```javascript
{
  reason: string;
}
```

**Response (200)**:

```javascript
{
  success: true,
  message: "User suspended"
}
```

---

#### 14.4 Manage Featured Courses

```
PUT /api/admin/courses/:courseId/featured
Protected (Admin only)
```

**Request Body**:

```javascript
{
  featured: boolean;
}
```

---

#### 14.5 Get All Users (Pagination)

```
GET /api/admin/users
Protected (Admin only)
```

**Query Parameters**:

```
?role=student|instructor|admin
?status=active|suspended
?page=1
?limit=20
```

---

## RATE LIMITING & SECURITY

### Rate Limiting

- Authentication endpoints: 5 requests per minute per IP
- Search/filter endpoints: 30 requests per minute per user
- General endpoints: 100 requests per minute per user
- File upload: 10 files per minute per user

### Security Headers

- CORS: Configured for frontend domain
- HTTPS: Required in production
- Helmet: Security headers middleware
- Input validation: All endpoints
- SQL/NoSQL injection protection: Mongoose validation
- CSRF protection: Token-based for state-changing operations

---

## ERROR CODES

| Code | Meaning                                  |
| ---- | ---------------------------------------- |
| 400  | Bad Request - Validation failed          |
| 401  | Unauthorized - No token or invalid token |
| 403  | Forbidden - Insufficient permissions     |
| 404  | Not Found - Resource doesn't exist       |
| 409  | Conflict - Duplicate resource            |
| 422  | Unprocessable Entity - Validation error  |
| 500  | Server Error                             |

---

**This architecture is ready for implementation**
