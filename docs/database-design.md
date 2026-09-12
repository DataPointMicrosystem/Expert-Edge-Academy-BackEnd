# Database Design - ExpertEdge Academy

**Date**: September 12, 2026  
**Status**: Pre-Implementation  
**Database**: MongoDB

---

## ER DIAGRAM (Conceptual)

```
User (1) ──→ (N) Profile
User (1) ──→ (N) Course (as instructor)
User (1) ──→ (N) Enrollment
User (1) ──→ (N) CartItem
User (1) ──→ (N) Review
User (1) ──→ (N) WishlistItem
User (1) ──→ (N) Notification
User (1) ──→ (N) Certificate

Course (1) ──→ (N) Section
Course (1) ──→ (N) Enrollment
Course (1) ──→ (N) CartItem
Course (1) ──→ (N) Review
Course (1) ──→ (N) WishlistItem
Course (1) ──→ (1) Instructor (User)
Course (1) ──→ (N) Payment
Course (1) ──→ (N) Quiz

Section (1) ──→ (N) Lesson
Section (1) ──→ (1) Course

Lesson (1) ──→ (1) Section
Lesson (1) ──→ (N) LessonProgress
Lesson (1) ──→ (1) Quiz (optional)

Quiz (1) ──→ (N) Question
Quiz (1) ──→ (1) Course

Question (1) ──→ (N) QuizAttempt
Question (1) ──→ (1) Quiz

QuizAttempt (1) ──→ (1) Enrollment
QuizAttempt (1) ──→ (1) Question

Enrollment (1) ──→ (N) LessonProgress
Enrollment (1) ──→ (N) QuizAttempt
Enrollment (1) ──→ (1) Certificate (optional)
Enrollment (1) ──→ (1) Payment (optional)

Payment (1) ──→ (1) Enrollment
Payment (1) ──→ (1) Course

Review (1) ──→ (1) Enrollment
Review (1) ──→ (1) Course

Certificate (1) ──→ (1) Enrollment

Category (1) ──→ (N) Course
```

---

## DATABASE COLLECTIONS & SCHEMAS

### 1. **users**

```javascript
{
  _id: ObjectId,
  fullName: String (required, trim),
  email: String (required, unique, lowercase, trim),
  password: String (required, hashed),
  role: Enum(['student', 'instructor', 'admin'], default: 'student'),
  avatar: String (optional, URL),
  bio: String (optional),
  isVerified: Boolean (default: false),
  isActive: Boolean (default: true),
  isSuspended: Boolean (default: false),

  // OAuth
  googleId: String (optional),
  githubId: String (optional),

  // Email verification
  otp: String (optional),
  otpExpires: Date (optional),

  // Timestamps
  createdAt: Date (default: now),
  updatedAt: Date (default: now),
  lastLogin: Date (optional),

  // Indices
  // Index on: email, role, isVerified, isActive, isSuspended
}
```

---

### 2. **profiles** (Extended user information)

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users, required, unique),
  profileType: Enum(['student', 'instructor']),

  // Common fields
  phone: String (optional),
  dateOfBirth: Date (optional),
  gender: String (optional),
  country: String (optional),

  // For instructors
  expertise: [String] (optional),
  experience: Number (years, optional),
  rating: Number (0-5, default: 0),
  studentCount: Number (default: 0),
  courseCount: Number (default: 0),
  totalEarnings: Number (default: 0),
  accountNumber: String (optional, for payments),
  bankName: String (optional),

  // Social links
  socialLinks: {
    website: String,
    twitter: String,
    linkedin: String,
    github: String
  },

  createdAt: Date,
  updatedAt: Date
}
```

---

### 3. **categories**

```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  slug: String (required, unique),
  description: String (optional),
  icon: String (optional, emoji or icon name),
  thumbnail: String (optional, URL),
  isActive: Boolean (default: true),
  order: Number (for sorting),
  createdAt: Date,
  updatedAt: Date,

  // Indices
  // Index on: slug, isActive
}
```

---

### 4. **courses**

```javascript
{
  _id: ObjectId,
  title: String (required),
  slug: String (required, unique),
  description: String (required),
  shortDescription: String (required),
  instructor: ObjectId (ref: users, required),
  category: ObjectId (ref: categories, required),

  // Pricing
  price: Number (in ₦, default: 0),
  originalPrice: Number (in ₦, optional),
  discountPercentage: Number (optional, 0-100),
  isPaid: Boolean (default: false),
  prerequisites: [ObjectId] (ref: courses, optional),

  // Course details
  level: Enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels'], required),
  language: String (default: 'English'),

  // Duration
  totalDuration: Number (in seconds, calculated),

  // Status
  status: Enum(['draft', 'pending_review', 'approved', 'published', 'rejected', 'archived'], default: 'draft'),
  isPublished: Boolean (default: false),
  rejectionReason: String (optional),

  // Visibility
  featured: Boolean (default: false),
  trending: Boolean (default: false),

  // Media
  thumbnail: String (required, URL from Cloudinary),
  previewVideoUrl: String (optional),

  // Learning outcomes
  learningOutcomes: [String],
  requirements: [String],

  // Ratings and reviews (denormalized for performance)
  rating: Number (average, 0-5, default: 0),
  reviewCount: Number (default: 0),
  enrollmentCount: Number (default: 0),
  completionCount: Number (default: 0),

  // Content
  sections: [ObjectId] (ref: sections),
  lectureCount: Number (calculated),

  // Dates
  createdAt: Date,
  updatedAt: Date,
  publishedAt: Date (optional),

  // Indices
  // Index on: slug, status, isPublished, instructor, category, featured, trending
}
```

---

### 5. **sections**

```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: courses, required),
  title: String (required),
  description: String (optional),
  order: Number (required, for sorting),

  lessons: [ObjectId] (ref: lessons),

  createdAt: Date,
  updatedAt: Date,

  // Indices
  // Index on: courseId, order
}
```

---

### 6. **lessons**

```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: courses, required),
  sectionId: ObjectId (ref: sections, required),
  title: String (required),
  description: String (optional),
  order: Number (required, for sorting),

  // Content type
  type: Enum(['video', 'document', 'quiz', 'assignment'], default: 'video'),

  // Video content
  videoUrl: String (optional, from Cloudinary),
  videoDuration: Number (in seconds, optional),

  // Document/resource content
  documentUrl: String (optional, from Cloudinary),

  // Preview status
  isPreviewable: Boolean (default: false),

  // Additional resources
  resources: [{
    title: String,
    url: String (from Cloudinary),
    fileType: String
  }],

  // For tracking
  isPublished: Boolean (default: true),

  createdAt: Date,
  updatedAt: Date,

  // Indices
  // Index on: courseId, sectionId, order
}
```

---

### 7. **enrollments**

```javascript
{
  _id: ObjectId,
  studentId: ObjectId (ref: users, required),
  courseId: ObjectId (ref: courses, required),

  // Enrollment details
  enrollmentDate: Date (default: now),
  enrollmentType: Enum(['free', 'paid'], required),

  // Progress
  completedLessons: Number (default: 0),
  totalLessons: Number,
  progressPercentage: Number (0-100, calculated, default: 0),
  lastAccessedLesson: ObjectId (ref: lessons, optional),
  lastAccessedAt: Date (optional),

  // Status
  status: Enum(['active', 'completed', 'dropped'], default: 'active'),
  completedAt: Date (optional),

  // Certificate
  certificateIssued: Boolean (default: false),
  certificateId: ObjectId (ref: certificates, optional),

  // For paid courses - link to payment
  paymentId: ObjectId (ref: payments, optional),

  // Timestamps
  createdAt: Date,
  updatedAt: Date,

  // Unique constraint: student can only enroll once per course
  // Index on: studentId, courseId (unique), status
}
```

---

### 8. **lesson_progress**

```javascript
{
  _id: ObjectId,
  enrollmentId: ObjectId (ref: enrollments, required),
  lessonId: ObjectId (ref: lessons, required),
  courseId: ObjectId (ref: courses, required),

  // Completion status
  isCompleted: Boolean (default: false),
  completedAt: Date (optional),

  // Viewing progress (for videos)
  watchedDuration: Number (in seconds, default: 0),

  // Timestamps
  startedAt: Date,
  updatedAt: Date,

  // Indices
  // Index on: enrollmentId, lessonId (unique together)
}
```

---

### 9. **quizzes**

```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: courses, required),
  lessonId: ObjectId (ref: lessons, optional),
  title: String (required),
  description: String (optional),

  // Quiz settings
  totalQuestions: Number,
  passingScore: Number (percentage, default: 70),
  maxAttempts: Number (optional, null = unlimited),
  shuffleQuestions: Boolean (default: false),

  // Duration
  duration: Number (in minutes, optional),

  // Questions
  questions: [ObjectId] (ref: questions),

  isPublished: Boolean (default: true),

  createdAt: Date,
  updatedAt: Date,

  // Indices
  // Index on: courseId, lessonId
}
```

---

### 10. **questions**

```javascript
{
  _id: ObjectId,
  quizId: ObjectId (ref: quizzes, required),
  courseId: ObjectId (ref: courses, required),

  title: String (required, question text),
  type: Enum(['multiple_choice', 'true_false', 'short_answer', 'essay'], required),
  order: Number (required),

  // Options (for multiple choice)
  options: [{
    _id: ObjectId,
    text: String,
    isCorrect: Boolean
  }],

  // Correct answer(s)
  correctAnswer: String (for true/false, short answer),
  correctAnswers: [String] (for multiple possible answers),

  // Points
  points: Number (default: 1),

  // Explanation
  explanation: String (optional),

  createdAt: Date,
  updatedAt: Date,

  // Indices
  // Index on: quizId, courseId
}
```

---

### 11. **quiz_attempts**

```javascript
{
  _id: ObjectId,
  enrollmentId: ObjectId (ref: enrollments, required),
  quizId: ObjectId (ref: quizzes, required),
  courseId: ObjectId (ref: courses, required),
  studentId: ObjectId (ref: users, required),

  // Attempt details
  attemptNumber: Number (1, 2, 3...),
  startedAt: Date,
  submittedAt: Date (optional),

  // Scoring
  totalQuestions: Number,
  answeredQuestions: Number,
  correctAnswers: Number,
  score: Number (out of points),
  percentage: Number (0-100),
  passed: Boolean (default: false),

  // Answers
  answers: [{
    questionId: ObjectId (ref: questions),
    userAnswer: String,
    isCorrect: Boolean,
    points: Number
  }],

  // Status
  status: Enum(['in_progress', 'submitted'], default: 'in_progress'),

  createdAt: Date,
  updatedAt: Date,

  // Indices
  // Index on: enrollmentId, quizId
}
```

---

### 12. **payments**

```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: courses, required),
  studentId: ObjectId (ref: users, required),
  enrollmentId: ObjectId (ref: enrollments, optional),

  // Amount
  amount: Number (in ₦, required),
  originalAmount: Number (before discount),
  discountAmount: Number (default: 0),
  currency: String (default: 'NGN'),

  // Payment reference
  transactionReference: String (unique, from payment provider),
  paymentMethod: String (optional),

  // Status
  status: Enum(['pending', 'successful', 'failed', 'abandoned'], default: 'pending'),

  // Payment provider info
  paymentProvider: String (default: 'kora'),
  providerTransactionId: String (optional),
  providerResponse: Object (raw response from provider),

  // Instructor commission
  instructorId: ObjectId (ref: users),
  instructorAmount: Number (amount instructor receives after platform fee),
  platformFee: Number,
  platformFeePercentage: Number (default from PLATFORM_FEE_PERCENTAGE),

  // Timestamps
  createdAt: Date,
  completedAt: Date (optional),

  // Indices
  // Index on: transactionReference (unique), courseId, studentId, status
}
```

---

### 13. **reviews**

```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: courses, required),
  enrollmentId: ObjectId (ref: enrollments, required),
  studentId: ObjectId (ref: users, required),

  // Review content
  title: String (required),
  content: String (required),
  rating: Number (1-5, required),

  // Moderation
  isApproved: Boolean (default: true),

  // Interactions
  helpfulCount: Number (default: 0),
  unHelpfulCount: Number (default: 0),

  createdAt: Date,
  updatedAt: Date,

  // Indices
  // Index on: courseId, studentId (unique together), isApproved
}
```

---

### 14. **certificates**

```javascript
{
  _id: ObjectId,
  enrollmentId: ObjectId (ref: enrollments, required),
  courseId: ObjectId (ref: courses, required),
  studentId: ObjectId (ref: users, required),

  // Certificate details
  certificateNumber: String (unique),

  // Verification
  verificationCode: String (unique),

  // Issue date
  issuedAt: Date (default: now),
  completionDate: Date (required),
  studentName: String (required),
  courseTitle: String (required),

  // Validity (optional)
  validUntil: Date (optional),

  createdAt: Date,

  // Indices
  // Index on: courseId, studentId, certificateNumber, verificationCode
}
```

---

### 15. **cart_items**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users, required),
  courseId: ObjectId (ref: courses, required),

  // Price at time of adding
  price: Number (in ₦),
  originalPrice: Number (optional),
  discountPercentage: Number (optional),

  addedAt: Date (default: now),

  // Indices
  // Index on: userId, courseId (unique together)
}
```

---

### 16. **wishlist_items**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users, required),
  courseId: ObjectId (ref: courses, required),

  addedAt: Date (default: now),

  // Indices
  // Index on: userId, courseId (unique together)
}
```

---

### 17. **notifications**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users, required),

  // Notification type
  type: Enum([
    'email_verification',
    'password_reset',
    'course_enrollment',
    'payment_success',
    'payment_failed',
    'course_approval',
    'course_rejection',
    'course_update',
    'quiz_completed',
    'certificate_issued',
    'course_completion',
    'admin_announcement'
  ], required),

  // Content
  title: String (required),
  message: String (required),

  // Related data
  relatedData: {
    courseId: ObjectId (optional),
    enrollmentId: ObjectId (optional),
    paymentId: ObjectId (optional)
  },

  // Status
  isRead: Boolean (default: false),
  readAt: Date (optional),

  // Delivery
  emailSent: Boolean (default: false),
  inAppNotification: Boolean (default: true),

  createdAt: Date,

  // Indices
  // Index on: userId, isRead, createdAt
}
```

---

### 18. **admin_actions** (Audit log)

```javascript
{
  _id: ObjectId,
  adminId: ObjectId (ref: users, required),
  action: String (e.g., 'course_approved', 'user_suspended'),
  targetType: String (e.g., 'course', 'user'),
  targetId: ObjectId,

  // Details
  description: String,
  previousValue: Object (optional),
  newValue: Object (optional),

  createdAt: Date,

  // Indices
  // Index on: adminId, action, createdAt
}
```

---

## DATABASE INDEXES

### Performance-Critical Indexes

```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1, isVerified: 1 });
db.users.createIndex({ isActive: 1, isSuspended: 1 });

// Courses
db.courses.createIndex({ slug: 1 }, { unique: true });
db.courses.createIndex({ instructor: 1, status: 1 });
db.courses.createIndex({ category: 1, isPublished: 1 });
db.courses.createIndex({ featured: 1, trending: 1 });
db.courses.createIndex({ createdAt: -1 });

// Sections & Lessons
db.sections.createIndex({ courseId: 1, order: 1 });
db.lessons.createIndex({ courseId: 1, sectionId: 1, order: 1 });

// Enrollments
db.enrollments.createIndex({ studentId: 1, courseId: 1 }, { unique: true });
db.enrollments.createIndex({ courseId: 1, status: 1 });
db.enrollments.createIndex({ status: 1, completedAt: 1 });

// Lesson Progress
db.lesson_progress.createIndex(
  { enrollmentId: 1, lessonId: 1 },
  { unique: true },
);
db.lesson_progress.createIndex({ enrollmentId: 1, isCompleted: 1 });

// Payments
db.payments.createIndex({ transactionReference: 1 }, { unique: true });
db.payments.createIndex({ courseId: 1, studentId: 1 });
db.payments.createIndex({ status: 1, createdAt: -1 });

// Reviews
db.reviews.createIndex({ courseId: 1, studentId: 1 }, { unique: true });
db.reviews.createIndex({ courseId: 1, isApproved: 1 });

// Cart & Wishlist
db.cart_items.createIndex({ userId: 1, courseId: 1 }, { unique: true });
db.wishlist_items.createIndex({ userId: 1, courseId: 1 }, { unique: true });

// Notifications
db.notifications.createIndex({ userId: 1, isRead: 1, createdAt: -1 });
```

---

## DATA VALIDATION RULES

### Users

- Email must be valid email format
- Password minimum 8 characters
- Full name required, max 100 characters
- Role must be one of: student, instructor, admin

### Courses

- Title required, max 200 characters
- Description required, min 50 characters
- Price must be >= 0
- Original price must be >= price
- Level must be one of allowed values
- Instructor must be a valid user with teacher role

### Enrollments

- Only one enrollment per student per course
- Free courses auto-enroll
- Paid courses require a server-side verified Kora transaction
- Prerequisite courses must be completed before restricted enrollment/access

### Payments

- Amount must match course price
- Status transitions: pending → successful/failed/abandoned
- Transaction reference must be unique
- Store the configured platform fee percentage, platform fee, and instructor earnings

### Reviews

- Only enrolled students can review
- Rating 1-5
- Title and content required
- Only one review per course per student

---

## MIGRATION STRATEGY

Since this is MongoDB:

1. Run scripts to create initial collections
2. Add indices for performance
3. Validate schema with Mongoose models
4. No schema migrations needed (schema-less)

---

**Next**: API architecture with endpoint specifications will follow
