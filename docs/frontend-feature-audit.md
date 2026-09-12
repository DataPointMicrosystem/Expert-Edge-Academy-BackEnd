# ExpertEdge Academy - Frontend Feature Audit

**Date**: September 12, 2026  
**URL**: https://expertedgeacademy.vercel.app/  
**Status**: MVP Frontend - Authentication & Course Browsing Phase

---

## AUDIT SUMMARY

The frontend currently implements a **Course Marketplace MVP** with:

- ✅ Public landing page with featured/trending courses
- ✅ Course browsing and detail pages
- ✅ User authentication (email/password + OAuth)
- ✅ Shopping cart
- ✅ Instructor branding/profiles
- ❌ NO dashboard/learning interface (Not Yet Implemented)
- ❌ NO course player (Not Yet Implemented)
- ❌ NO search/filtering (Not Yet Implemented)
- ❌ NO admin panel (Not Yet Implemented)

---

## DISCOVERED PAGES & FEATURES

### 1. HOME / LANDING PAGE

**URL**: `/`  
**User Type**: Public (All)  
**Status**: ✅ Implemented

**Features**:

- Hero section with call-to-action
- Weekend sale banner (all courses ₦15,000 - time-limited)
- Featured courses section (6 course cards)
- Trending courses section (4 course cards)
- Instructor call-to-action ("Become an instructor")
- Testimonials/social proof section
- Category shortcuts (Data Science, ChatGPT, Prompt Engineering, UI/UX, Digital Marketing, Web Development)
- Learn benefits (Find, Learn, Earn certificate)
- Footer with links

**Data Required**:

- Featured courses list (title, price, instructor, rating, review count, thumbnail)
- Trending courses list (same as featured)
- Sale metadata (active status, discount percentage, time remaining)
- Category data

**Backend Endpoints Needed**:

- `GET /api/courses/featured` - Get featured courses
- `GET /api/courses/trending` - Get trending courses

---

### 2. COURSE DETAIL PAGE

**URL**: `/courses/{courseSlug}`  
**User Type**: Public (All)  
**Status**: ✅ Implemented  
**Examples**:

- `/courses/react-2024`
- `/courses/python-ds`
- `/courses/uiux-bootcamp`

**Features**:

- Course header with title, price, original price, discount percentage, rating, review count, student count
- "Add to cart" button
- "Buy now" button
- Badges (BESTSELLER, HOT, NEW, etc.)
- "What you'll learn" section (bullet points)
- "Requirements" section (prerequisites)
- "Course content" section showing:
  - Number of sections, lectures, total duration
  - Expandable sections with:
    - Section title
    - Number of lectures in section
    - Individual lectures with:
      - Title
      - Duration
      - Preview status (Preview badge)
      - Type indicator (📝 for quizzes)
  - "View curriculum" link for full syllabus
- Instructor card showing:
  - Instructor photo
  - Name
  - Rating (⭐)
  - Student count
  - Course count
  - Bio/description
- Course metadata:
  - Language (🌐)
  - Last updated (📅)
  - Duration (🎥)
  - Lecture count (📝)
  - Level (📶)
  - Lifetime access (♾️)
  - Mobile access (📱)
  - Certificate (🏆)
- "Ready to start learning" CTA with enrollment button

**Data Required**:

- Course: title, slug, description, price, originalPrice, discountPercentage, rating, reviewCount, studentCount, language, lastUpdated, level, thumbnail
- Sections: title, description, lectureCount
- Lectures: title, duration, type, preview (boolean)
- Instructor: name, photo, bio, rating, studentCount, courseCount
- Course badges: BESTSELLER, HOT, NEW status

**Backend Endpoints Needed**:

- `GET /api/courses/:slug` - Get single course details
- `GET /api/courses/:courseId/sections` - Get course sections and lectures
- `GET /api/instructors/:instructorId` - Get instructor profile
- `POST /api/cart/add` - Add course to cart (requires auth)

---

### 3. AUTHENTICATION - SIGN UP

**URL**: `/signup`  
**User Type**: Public  
**Status**: ✅ Implemented

**Features**:

- Role selection toggle (Two options):
  - "🎓 I want to learn"
  - "📚 I want to teach"
- Login link ("Already have an account? Log in")
- OAuth options:
  - Google ("Continue with Google")
  - GitHub ("Continue with GitHub")
- Email/password registration:
  - Full name input
  - Email input
  - Password input
- "Create learner account" / "Create instructor account" button (changes based on role)
- Terms & Privacy Policy acceptance checkbox
- Legal text: "By signing up, you agree to ExpertEdge's Terms of Service and Privacy Policy"

**Data Required**:

- User: fullName, email, password, role (STUDENT|INSTRUCTOR)

**Backend Endpoints Needed**:

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/google` - Google OAuth callback
- `POST /api/auth/github` - GitHub OAuth callback
- `GET /api/auth/verify/:token` - Email verification (if required)

---

### 4. AUTHENTICATION - LOGIN

**URL**: `/login`  
**User Type**: Public  
**Status**: ✅ Implemented

**Features**:

- Sign up link ("New to ExpertEdge? Sign up free")
- OAuth options:
  - Google ("Continue with Google")
  - GitHub ("Continue with GitHub")
- Email/password login:
  - Email input
  - Password input
  - "Forgot password?" link
- "Log in" button
- Terms & Privacy Policy acceptance checkbox
- Support for redirect parameter (e.g., `?redirectTo=/dashboard`)

**Data Required**:

- User credentials validation

**Backend Endpoints Needed**:

- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/github` - GitHub OAuth

---

### 5. PASSWORD RECOVERY - FORGOT PASSWORD

**URL**: `/forgot-password`  
**User Type**: Public  
**Status**: ✅ Implemented

**Features**:

- Heading: "Forgot your password?"
- Email input field
- "Send reset link" button
- "Remembered your password?" link back to login

**Data Required**:

- User email lookup

**Backend Endpoints Needed**:

- `POST /api/auth/forgot-password` - Request password reset email

---

### 6. PASSWORD RECOVERY - RESET PASSWORD

**URL**: `/reset-password`  
**User Type**: Public (via email link)  
**Status**: ✅ Implemented

**Features**:

- Heading: "Set a new password"
- "New password" input with Show/Hide toggle
- "Confirm new password" input with Show/Hide toggle
- "Reset password" button
- "Contact support" link if user needs help

**Data Required**:

- Reset token validation
- New password update

**Backend Endpoints Needed**:

- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/reset-password/:token` - Validate reset token

---

### 7. TEACH / BECOME INSTRUCTOR PAGE

**URL**: `/teach`  
**User Type**: Public  
**Status**: ✅ Implemented

**Features**:

- Hero section with call-to-action
- "Why teach" section (3 points):
  - Share what you know
  - Reach motivated learners
  - Grow your teaching business
- Detailed benefits sections
- "Create your facilitator account" button
- Links to instructor resources

**Data Required**:

- Marketing content (static)

**Backend Endpoints Needed**:

- None (informational page)

---

### 8. SHOPPING CART

**URL**: `/cart`  
**User Type**: All  
**Status**: ✅ Implemented (Limited - Empty State Shown)

**Features**:

- Cart heading
- Empty state message: "Your cart is empty"
- "Explore courses" button
- Implied features (when cart has items):
  - Course cards in cart
  - Price summary
  - Checkout button
  - Remove items ability

**Data Required**:

- User cart items
- Pricing data

**Backend Endpoints Needed**:

- `GET /api/cart` - Get user cart (requires auth)
- `POST /api/cart/add` - Add course to cart
- `DELETE /api/cart/remove/:courseId` - Remove course from cart
- `POST /api/cart/checkout` - Initiate checkout

---

## PAGES ATTEMPTED BUT NOT FOUND (404)

These URLs were tested but returned 404 errors. They may be:

- Protected routes (require authentication)
- Not yet implemented in frontend
- Using different URL patterns

| URL                     | Purpose              | Status        |
| ----------------------- | -------------------- | ------------- |
| `/dashboard`            | Learner dashboard    | Requires Auth |
| `/my-courses`           | My enrolled courses  | Not Found     |
| `/student`              | Student area         | Not Found     |
| `/profile`              | User profile         | Not Found     |
| `/account`              | Account settings     | Not Found     |
| `/settings`             | User settings        | Not Found     |
| `/categories`           | Browse by category   | Not Found     |
| `/search`               | Course search        | Not Found     |
| `/courses`              | All courses listing  | Not Found     |
| `/learn/:courseId`      | Course player        | Not Found     |
| `/courses/:id/learn`    | Course player        | Not Found     |
| `/player`               | Video player         | Not Found     |
| `/wishlist`             | Saved courses        | Not Found     |
| `/favorites`            | Favorite courses     | Not Found     |
| `/saved`                | Saved items          | Not Found     |
| `/pricing`              | Pricing page         | Not Found     |
| `/enterprise`           | Enterprise plans     | Not Found     |
| `/about`                | About page           | Not Found     |
| `/careers`              | Jobs page            | Not Found     |
| `/blog`                 | Blog                 | Not Found     |
| `/instructor-dashboard` | Instructor dashboard | Not Found     |
| `/create-course`        | Create new course    | Not Found     |
| `/admin`                | Admin panel          | Not Found     |

---

## INFERRED DATA STRUCTURES

Based on the frontend inspection, the following data entities are displayed and likely exist:

### Courses

```
{
  id: string,
  slug: string,
  title: string,
  description: string,
  price: number (₦),
  originalPrice: number (₦),
  level: string ("Beginner" | "Intermediate" | "Advanced" | "All Levels"),
  thumbnail: string (image URL),
  instructor: Instructor reference,
  rating: number (0-5),
  reviewCount: number,
  studentCount: number,
  duration: string ("38 hours"),
  lectureCount: number,
  language: string,
  lastUpdated: date,
  badges: string[] (["BESTSELLER", "HOT", "NEW"]),
  saleActive: boolean,
  saleDiscount: number (%),
  sections: Section[]
}
```

### Sections

```
{
  id: string,
  courseId: string,
  title: string,
  description: string,
  lectureCount: number,
  lectures: Lecture[]
}
```

### Lectures

```
{
  id: string,
  sectionId: string,
  title: string,
  duration: string ("5:22"),
  type: string ("video" | "quiz"),
  preview: boolean,
  content?: string (URL or content)
}
```

### Users

```
{
  id: string,
  fullName: string,
  email: string,
  password: string (hashed),
  role: string ("STUDENT" | "INSTRUCTOR" | "ADMIN"),
  avatar?: string (image URL),
  bio?: string,
  createdAt: date,
  isVerified: boolean
}
```

### Instructors (extends Users)

```
{
  // ... from Users ...
  rating: number (0-5),
  studentCount: number,
  courseCount: number,
  courses: Course[]
}
```

### Cart

```
{
  id: string,
  userId: string,
  items: CartItem[],
  totalPrice: number,
  createdAt: date,
  updatedAt: date
}
```

### CartItem

```
{
  id: string,
  cartId: string,
  courseId: string,
  course: Course,
  price: number,
  addedAt: date
}
```

---

## FEATURES NOT YET IMPLEMENTED (Not Visible in Frontend)

These features are NOT present in the current frontend and should NOT be implemented in the backend until they appear:

- ❌ Dashboard (learner or instructor)
- ❌ Course enrollment/purchase flow completion
- ❌ Payment processing
- ❌ Course player/learning interface
- ❌ Progress tracking
- ❌ Quizzes/assessments
- ❌ Certificates
- ❌ Reviews/ratings submission
- ❌ Wishlist/favorites
- ❌ User profiles (public or private)
- ❌ Notifications
- ❌ Instructor course management
- ❌ Admin panel
- ❌ Search/filtering
- ❌ Course categories browsing
- ❌ User settings

---

## AUTHENTICATION METHODS OBSERVED

1. **Email & Password**
   - Sign up with full name, email, password
   - Sign up with role selection (STUDENT or INSTRUCTOR)
   - Login with email and password
   - Password reset via email link

2. **OAuth - Google**
   - "Continue with Google" on login
   - "Continue with Google" on signup

3. **OAuth - GitHub**
   - "Continue with GitHub" on login
   - "Continue with GitHub" on signup

---

## USER ROLES IDENTIFIED

1. **Student/Learner**
   - Browse courses
   - Sign up for learning
   - Add courses to cart
   - (Implied) Enroll in courses

2. **Instructor/Facilitator**
   - Sign up to teach
   - (Implied) Create courses
   - (Implied) Manage courses
   - Public instructor profile

3. **Admin** (Not visible in frontend)
   - (Assumed) Platform management

---

## CRITICAL OBSERVATIONS

1. **No Purchase Flow Visible**: The frontend shows "Add to cart" and "Buy now" but no actual checkout/payment page
2. **No Enrollment Visible**: "Enroll now" button exists but no learner dashboard shown
3. **No Course Player**: No learning interface is implemented
4. **No Dashboard**: Neither student nor instructor dashboard pages exist
5. **Limited Navigation**: Only specific URLs work; no dynamic routing for many features
6. **OAuth Setup**: Google and GitHub OAuth are referenced but not yet configured

---

## ASSUMPTIONS & CLARIFICATIONS NEEDED

| Item                     | Status  | Notes                                                                  |
| ------------------------ | ------- | ---------------------------------------------------------------------- |
| Payment processing       | Unknown | Backend will need to implement, but frontend checkout flow not visible |
| Email verification       | Unknown | Might be required after signup                                         |
| Admin panel              | Unknown | Not visible in frontend; scope unclear                                 |
| Course approval workflow | Unknown | Do instructors auto-publish or require admin approval?                 |
| Review/rating system     | Unknown | Ratings shown but no submission interface found                        |
| User profile pages       | Unknown | Instructor profiles shown but user-editable profiles not found         |
| Search & filtering       | Unknown | Not yet implemented in frontend                                        |

---

## NEXT STEPS

1. **Clarify scope**: Ask about payment processing, admin features, and learner dashboard
2. **Clarify purchase flow**: How does "Buy now" lead to payment and enrollment?
3. **Clarify course management**: How do instructors create and manage courses?
4. **Clarify learner dashboard**: What features should it include?
5. **Clarify role permissions**: What can each role do?

---

**End of Frontend Audit**
