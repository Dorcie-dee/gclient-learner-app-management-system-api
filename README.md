
#  GClient Learner Application Management System

Welcome to **GClient LAMS** , a full-featured learner application management system with **Admins and Learners** roles.

This project covers: **authentication, email verification, learner enrollment, payments (full & part), tracks, courses, invoices, and reviews**. Payments are integrated with **Paystack (test mode)**.

---

## ⚡ System Overview

* 🟢 **Open Access**: Anyone can register & explore the app before paying.
* 💳 **Payments**:

  * **Full payment** → unrestricted access.
  * **Part payment** → temporary access, restricted later.

* 👩‍🎓 **Learners**:

  * Can update profile.
  * Gain access to tracks & courses after payment.
  * Can leave **one review per track**.

* 👨‍💼 **Admins**:

  * Create/manage tracks & courses.
  * Monitor learners, payments, and revenue reports.

---

# 🔑 Auth Module

Handles **user identity & security** — signup, login, email verification, password reset, and authentication.

### Endpoints

| Method | Endpoint                              | Description                    | Role          |
| ------ | ------------------------------------- | ------------------------------ | ------------- |
| POST   | `/api/auth/register-admin`            | Register a new admin           | Open          |
| POST   | `/api/auth/register-learner`          | Register a new learner         | Open          |
| POST   | `/api/auth/login`                     | Login with email & password    | Open          |
| POST   | `/api/auth/verify-email`              | Verify user email              | Open          |
| POST   | `/api/auth/resend-verification-token` | Resend verification email      | Open          |
| POST   | `/api/auth/forgot-password`           | Request password reset         | Open          |
| POST   | `/api/auth/reset-password`            | Reset password with token      | Open          |
| POST   | `/api/auth/update-password`           | Change password (logged in)    | Authenticated |
| POST   | `/api/auth/logout`                    | Logout user                    | Authenticated |
| GET    | `/api/auth/check-auth`                | Check if user is authenticated | Authenticated |
| PUT    | `/api/auth/update-user`               | Update / complete user profile | Authenticated |

---

### Example: Register Learner

**Request**

```json
POST /api/auth/register-learner
{
  "fullName": "John Doe",
  "email": "johndoe@example.com",
  "password": "StrongPass123"
}
```

**Response**

```json
{
  "message": "Learner registered successfully. Check your email for the OTP token.",
  "user": {
    "id": "64a12f",
    "role": "learner",
    "email": "johndoe@example.com"
  }
}
```

---

### Example: Login

**Request**

```json
POST /api/auth/login
{
  "email": "johndoe@example.com",
  "password": "StrongPass123"
}
```

**Response**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64a12f",
    "role": "learner",
    "email": "johndoe@example.com"
  }
}
```

---

# 👩‍🎓 Learner Module

Manages learner profiles & visibility. Admins can view all learners, while learners can only manage their own account.

### Endpoints

| Method | Endpoint            | Description            | Role    |
| ------ | ------------------- | ---------------------- | ------- |
| PUT    | `/api/learners/:id` | Update learner profile | Learner |
| GET    | `/api/learners`     | Get all learners       | Admin   |
| GET    | `/api/learners/:id` | Get specific learner   | Admin   |

---

### Example: Update Learner Profile

**Request**

```json
PUT /api/learners/64a12f
{
  "bio": "I love coding and learning new things.",
  "phone": "+233500000000"
}
```

**Response**

```json
{
  "message": "Learner updated successfully",
  "learner": {
    "id": "64a12f",
    "bio": "I love coding and learning new things.",
    "phone": "+233500000000"
  }
}
```

---

# 📚 Track Module

Tracks represent structured learning paths (e.g., "Full Stack Development"). Admins create/manage them, learners can view & rate them.

### Endpoints

| Method | Endpoint                  | Description              | Role    |
| ------ | ------------------------- | ------------------------ | ------- |
| POST   | `/api/tracks`             | Create a track           | Admin   |
| GET    | `/api/tracks`             | Get all tracks           | Open    |
| GET    | `/api/tracks/:id`         | Get single track         | Open    |
| PUT    | `/api/tracks/:id`         | Update track             | Admin   |
| DELETE | `/api/tracks/:id`         | Delete track             | Admin   |
| GET    | `/api/tracks/:id/ratings` | View ratings for a track | Open    |
| POST   | `/api/tracks/:id/rate`    | Rate & review track      | Learner |

---

### Example: Create Track (Admin)

**Request**

```json
POST /api/tracks
{
  "title": "Full Stack Development",
  "description": "Learn frontend and backend development",
  "price": 200
}
```

**Response**

```json
{
  "message": "Track created successfully",
  "track": {
    "id": "trk_001",
    "title": "Full Stack Development",
    "price": 200
  }
}
```

---

### Example: Rate Track (Learner)

**Request**

```json
POST /api/tracks/trk_001/rate
{
  "rating": 5,
  "review": "Amazing track! Very detailed."
}
```

**Response**

```json
{
  "message": "Thank you for your feedback!",
  "rating": {
    "trackId": "trk_001",
    "userId": "64a12f",
    "rating": 5,
    "review": "Amazing track! Very detailed."
  }
}
```

---

# 📖 Course Module

Courses live inside tracks. Only admins can create/update/delete them. Learners access courses after payment.

### Endpoints

| Method | Endpoint           | Description                 | Role  |
| ------ | ------------------ | --------------------------- | ----- |
| POST   | `/api/courses`     | Create course under a track | Admin |
| GET    | `/api/courses`     | Get all courses             | Open  |
| GET    | `/api/courses/:id` | Get single course           | Open  |
| PUT    | `/api/courses/:id` | Update course               | Admin |
| DELETE | `/api/courses/:id` | Delete course               | Admin |

---

### Example: Create Course (Admin)

**Request**

```json
POST /api/courses
{
  "title": "Intro to JavaScript",
  "trackId": "trk_001",
  "content": "Variables, Functions, and Loops",
  "duration": "4 weeks"
}
```

**Response**

```json
{
  "message": "Course created successfully",
  "course": {
    "id": "crs_101",
    "title": "Intro to JavaScript",
    "trackId": "trk_001"
  }
}
```

---

# 💳 Invoice Module

Handles payments and learner access control. Integrates with **Paystack**.

* **Full Payment** → Grants full access immediately.
* **Part Payment** → Grants temporary access; restrictions apply later.

### Endpoints

| Method | Endpoint            | Description           | Role    |
| ------ | ------------------- | --------------------- | ------- |
| POST   | `/api/invoices`     | Create invoice        | Learner |
| GET    | `/api/invoices`     | Get all invoices      | Admin   |
| GET    | `/api/invoices/:id` | Get single invoice    | Admin   |
| PUT    | `/api/invoices/:id` | Update invoice status | Admin   |

---

### Example: Create Invoice (Learner Payment)

**Request**

```json
POST /api/invoices
{
  "learnerId": "64a12f",
  "trackId": "trk_001",
  "paymentType": "part",
  "amount": 100
}
```

**Response**

```json
{
  "message": "Invoice created successfully and email sent to learner",
  "invoice": {
    "id": "inv_450",
    "learnerId": "64a12f",
    "trackId": "trk_001",
    "paymentType": "part",
    "amount": 100,
    "status": "pending"
  }
}
```

---

# 💡 Friendly Note

If you made it this far 👏, you’re officially in the 1% of devs who **actually read documentation**.
That means a lot 💙. This project spans more than just the writing of code. It’s about **real-world learning, payments, and access control**.

---

# 🤝 Contributing

PRs are welcome. Please open an issue for major changes before submitting.

---

# ⭐ Support

👉 **Star this repo** ⭐ if you like it
👉 **Check out my other projects** 🌱
👉 **Let’s collaborate on something impactful** 

---

# 👋 Final Note

Thanks for stopping by 💜
Keep coding, keep learning, and let’s build something amazing together! ✨
