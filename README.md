# AgroNew (FarmerApp)

**Group:** Y3S2-WE-SE-21

**Live URL:** https://farmerapp-sable.vercel.app/

**Documentation**
Deployment Report:
https://drive.google.com/file/d/1u7wJFQtYk1FykcZ0v2hcDVMq5wtTJjHg/view?usp=sharing

Testing Instructions Report:
https://drive.google.com/file/d/1MgAvL1Z3Tvck3dL4oUdybOfDTChtOwcP/view?usp=sharing


AgroNew is a full-stack agriculture platform with:
- **Frontend:** React + Vite
- **Backend:** Node.js + Express + MongoDB
- **Core domains:** User onboarding/profile, course learning, loans/repayments, support tickets/ratings, admin planning/weather

## 1. Setup Instructions

### 1.1 Prerequisites
- Node.js 18+
- npm 9+
- MongoDB (local or Atlas)
- Cloudinary account (for image upload)
- Google OAuth Client ID (for Google login)
- OpenWeather API key (for weather endpoints)
- GitHub token (optional, only for AI quiz explanations)

### 1.2 Clone and Install
```bash
git clone <your-repo-url>
cd FarmerApp

cd backend
npm install

cd ../frontend
npm install
```

### 1.3 Configure Environment Variables

Create **backend/.env**:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
JWT_SECRET=<your-jwt-secret>

GOOGLE_CLIENT_ID=<google-client-id>
GITHUB_TOKEN=<github-token>

CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

OPENWEATHER_API_KEY=<openweather-key>
```

Create **frontend/.env**:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=<google-client-id>
```

### 1.4 Run the Project

Terminal 1 (backend):
```bash
cd backend
npm run server
```

Terminal 2 (frontend):
```bash
cd frontend
npm run dev
```

Open the frontend URL shown by Vite (usually http://localhost:5173).

### 1.5 Run Tests
```bash
cd backend
npm test
```

---

## 2. API Endpoint Documentation

## 2.1 API Conventions
- **Base URL:** `/api`
- **Auth Type:** Bearer JWT in `Authorization` header
  - `Authorization: Bearer <token>`
- **Content Type:** `application/json` unless noted

### Common Response Pattern
```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

Error example:
```json
{
  "success": false,
  "message": "Validation or server error"
}
```

## 2.2 Authentication and User APIs

### POST /api/signup
- Auth: None
- Request:
```json
{
  "name": "John Farmer",
  "email": "john@example.com",
  "password": "secret123",
  "role": "farmer"
}
```
- Response (201):
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "...", "name": "John Farmer", "role": "farmer" }
}
```

### POST /api/login
- Auth: None
- Request:
```json
{ "email": "john@example.com", "password": "secret123" }
```
- Response (200):
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "...", "email": "john@example.com", "role": "farmer" }
}
```

### POST /api/google-auth
- Auth: None
- Request:
```json
{ "credential": "<google-id-token>" }
```
- Response (200):
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "...", "name": "Google User", "role": "farmer" }
}
```

### GET /api/user/:userId
- Auth: Required (`isSelfOrAdmin`)
- Response (200):
```json
{ "success": true, "data": { "id": "...", "name": "John Farmer", "email": "john@example.com" } }
```

### PUT /api/user/:userId
- Auth: Required (`isSelfOrAdmin`)
- Request (example):
```json
{ "name": "John Updated", "phone": "0771234567" }
```
- Response (200):
```json
{ "success": true, "message": "Account updated", "data": { "id": "..." } }
```

### PUT /api/user/:userId/profile-image
- Auth: Required (`isSelfOrAdmin`)
- Request:
```json
{ "profileImage": "https://..." }
```
- Response (200):
```json
{ "success": true, "message": "Profile picture updated" }
```

### PUT /api/user/:userId/change-password
- Auth: Required (`isSelfOrAdmin`)
- Request:
```json
{
  "currentPassword": "old123",
  "newPassword": "newStrong123"
}
```
- Response (200):
```json
{ "success": true, "message": "Password changed successfully" }
```

### PUT /api/user/:userId/deactivate
- Auth: Required (`isSelfOrAdmin`)
- Response (200):
```json
{ "success": true, "message": "Account deactivated" }
```

### PUT /api/user/:userId/activate
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "message": "Account activated" }
```

### GET /api/users
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "data": [{ "id": "...", "email": "user@example.com" }] }
```

### POST /api/users/admin
- Auth: Required (`adminOnly`)
- Request:
```json
{ "name": "Admin", "email": "admin@example.com", "password": "admin123" }
```
- Response (201):
```json
{ "success": true, "message": "Admin created" }
```

## 2.3 Financial Info APIs

### POST /api/financial/
- Auth: Required (`farmerOnly`)
- Request:
```json
{
  "monthlyIncome": 120000,
  "dependentNames": "Person A, Person B"
}
```
- Response (201):
```json
{ "success": true, "message": "Financial info created successfully", "data": { "userId": "..." } }
```

### GET /api/financial/my
- Auth: Required (`farmerOnly`)
- Response (200):
```json
{ "success": true, "data": { "monthlyIncome": 120000, "dependentNames": ["Person A", "Person B"] } }
```

### PUT /api/financial/my
- Auth: Required (`farmerOnly`)
- Request:
```json
{ "monthlyIncome": 150000, "dependentNames": "Person A, Person B" }
```
- Response (200):
```json
{ "success": true, "message": "Financial info updated successfully", "data": { "monthlyIncome": 150000 } }
```

### DELETE /api/financial/my
- Auth: Required (`farmerOnly`)
- Response (200):
```json
{ "success": true, "message": "Financial info deleted successfully" }
```

### GET /api/financial/
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "count": 12, "data": [] }
```

## 2.4 Location Farming APIs

### POST /api/location-farming/
- Auth: Required (`farmerOnly`)
- Request:
```json
{ "district": "Gampaha", "farmSize": 2.5, "cropType": "Rice" }
```
- Response (201):
```json
{ "success": true, "data": { "district": "Gampaha" } }
```

### GET /api/location-farming/my
- Auth: Required (`farmerOnly`)
- Response (200):
```json
{ "success": true, "data": { "district": "Gampaha" } }
```

### PUT /api/location-farming/my
- Auth: Required (`farmerOnly`)
- Request:
```json
{ "district": "Kurunegala", "farmSize": 3.0 }
```
- Response (200):
```json
{ "success": true, "data": { "district": "Kurunegala" } }
```

### DELETE /api/location-farming/my
- Auth: Required (`farmerOnly`)
- Response (200):
```json
{ "success": true, "message": "Location farming deleted successfully" }
```

### GET /api/location-farming/
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "count": 8, "data": [] }
```

## 2.5 Training Engagement APIs

### POST /api/training-engagement/
- Auth: Required (`farmerOnly`)
- Request:
```json
{ "sessionsAttended": 4, "interestAreas": ["Irrigation", "Pest Control"] }
```
- Response (201):
```json
{ "success": true, "data": { "sessionsAttended": 4 } }
```

### GET /api/training-engagement/my
- Auth: Required (`farmerOnly`)
- Response (200):
```json
{ "success": true, "data": { "sessionsAttended": 4 } }
```

### PUT /api/training-engagement/my
- Auth: Required (`farmerOnly`)
- Request:
```json
{ "sessionsAttended": 6 }
```
- Response (200):
```json
{ "success": true, "data": { "sessionsAttended": 6 } }
```

### DELETE /api/training-engagement/my
- Auth: Required (`farmerOnly`)
- Response (200):
```json
{ "success": true, "message": "Training engagement deleted successfully" }
```

### GET /api/training-engagement/
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "count": 10, "data": [] }
```

## 2.6 Verification Trust APIs

### POST /api/verification-trust/
- Auth: Required (`farmerOnly`)
- Request:
```json
{ "nationalId": "123456789V", "verificationNote": "Sample" }
```
- Response (201):
```json
{ "success": true, "data": { "status": "Pending" } }
```

### GET /api/verification-trust/my
- Auth: Required (`farmerOnly`)
- Response (200):
```json
{ "success": true, "data": { "status": "Pending" } }
```

### PUT /api/verification-trust/my
- Auth: Required (`farmerOnly`)
- Request:
```json
{ "verificationNote": "Updated details" }
```
- Response (200):
```json
{ "success": true, "data": { "status": "Pending" } }
```

### GET /api/verification-trust/
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "count": 15, "data": [] }
```

### GET /api/verification-trust/:userId
- Auth: Required (`adminOnly` + ObjectId param)
- Response (200):
```json
{ "success": true, "data": { "userId": "...", "status": "Verified" } }
```

### PUT /api/verification-trust/:userId
- Auth: Required (`adminOnly` + ObjectId param)
- Request:
```json
{ "status": "Verified", "adminNote": "Documents validated" }
```
- Response (200):
```json
{ "success": true, "data": { "status": "Verified" } }
```

### DELETE /api/verification-trust/:userId
- Auth: Required (`adminOnly` + ObjectId param)
- Response (200):
```json
{ "success": true, "message": "Verification record deleted" }
```

## 2.7 Course Management APIs

### Courses

#### POST /api/courses/
- Auth: Required (`adminOnly`)
- Request:
```json
{
  "title": "Soil Basics",
  "description": "Intro course",
  "thumbnailUrl": "https://...",
  "isPublished": false
}
```
- Response (201):
```json
{ "success": true, "course": { "_id": "...", "title": "Soil Basics" } }
```

#### GET /api/courses/
- Auth: None
- Query: `page`, `limit`
- Response (200):
```json
{
  "success": true,
  "courses": [],
  "pagination": { "currentPage": 1, "totalPages": 1, "totalCourses": 0, "limit": 10 }
}
```

#### GET /api/courses/with-details
- Auth: None
- Response (200):
```json
{ "success": true, "courses": [{ "_id": "...", "lessons": [], "quizzes": [] }] }
```

#### GET /api/courses/:id
- Auth: Required
- Response (200):
```json
{ "success": true, "course": { "_id": "...", "title": "Soil Basics", "enrollmentCount": 20 } }
```

#### PUT /api/courses/:id
- Auth: Required (`adminOnly`)
- Request:
```json
{ "title": "Updated title", "isPublished": true }
```
- Response (200):
```json
{ "success": true, "course": { "_id": "...", "isPublished": true } }
```

#### DELETE /api/courses/:id
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "message": "Course and all related data deleted successfully" }
```

### Lessons

#### GET /api/lessons/course/:courseId
- Auth: Required
- Response (200):
```json
{ "success": true, "lessons": [] }
```

#### POST /api/lessons/course/:courseId
- Auth: Required (`adminOnly`)
- Request:
```json
{
  "title": "Lesson 1",
  "content": "Lesson content",
  "youtubeUrl": "https://youtu.be/..."
}
```
- Response (201):
```json
{ "success": true, "lesson": { "_id": "...", "title": "Lesson 1" } }
```

#### GET /api/lessons/:id
- Auth: Required
- Response (200):
```json
{ "success": true, "lesson": { "_id": "..." } }
```

#### PUT /api/lessons/:id
- Auth: Required (`adminOnly`)
- Request:
```json
{ "title": "Updated Lesson", "content": "Updated content" }
```
- Response (200):
```json
{ "success": true, "lesson": { "_id": "...", "title": "Updated Lesson" } }
```

#### DELETE /api/lessons/:id
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "message": "Lesson deleted successfully" }
```

### Quizzes

#### POST /api/quizzes/lessons/:lessonId
- Auth: Required (`adminOnly`)
- Request:
```json
{ "title": "Lesson 1 Quiz", "passingScore": 70 }
```
- Response (201):
```json
{ "success": true, "quiz": { "_id": "...", "lesson": "..." } }
```

#### GET /api/quizzes/lessons/:lessonId
- Auth: Required
- Response (200):
```json
{ "success": true, "quiz": { "_id": "...", "questions": [] } }
```

#### PUT /api/quizzes/:id
- Auth: Required (`adminOnly`)
- Request:
```json
{ "title": "Updated Quiz", "passingScore": 75 }
```
- Response (200):
```json
{ "success": true, "message": "Quiz updated successfully", "quiz": { "_id": "..." } }
```

#### DELETE /api/quizzes/:id
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "message": "Quiz deleted successfully" }
```

### Questions

#### POST /api/questions/quiz/:quizId
- Auth: Required (`adminOnly`)
- Request:
```json
{
  "questionText": "What helps root growth?",
  "choices": [
    { "choiceText": "Nitrogen", "isCorrect": false },
    { "choiceText": "Phosphorus", "isCorrect": true }
  ],
  "order": 1
}
```
- Response (201):
```json
{ "success": true, "question": { "_id": "..." } }
```

#### GET /api/questions/quiz/:quizId
- Auth: Required
- Response (200):
```json
{ "success": true, "count": 2, "questions": [] }
```

#### PUT /api/questions/:id
- Auth: Required (`adminOnly`)
- Request:
```json
{ "questionText": "Updated text", "choices": [{ "choiceText": "A", "isCorrect": true }, { "choiceText": "B", "isCorrect": false }] }
```
- Response (200):
```json
{ "success": true, "message": "Question updated successfully", "question": { "_id": "..." } }
```

#### DELETE /api/questions/:id
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "message": "Question deleted successfully" }
```

### Enrollment and Progress

#### POST /api/enrollments/:userId/course/:courseId/enroll
- Auth: Required (`isSelfOrAdmin`)
- Response (201):
```json
{ "success": true, "message": "User enrolled successfully", "enrollment": { "_id": "..." } }
```

#### GET /api/enrollments/:userId
- Auth: Required (`isSelfOrAdmin`)
- Response (200):
```json
{ "success": true, "count": 1, "enrollments": [] }
```

#### GET /api/enrollments/:userId/course/:courseId/check-enrollment
- Auth: Required (`isSelfOrAdmin`)
- Response (200):
```json
{ "success": true, "isEnrolled": true, "enrollment": { "_id": "..." } }
```

#### PUT /api/enrollments/:userId/course/:courseId/lesson/:lessonId/complete
- Auth: Required (`isSelfOrAdmin`)
- Response (200):
```json
{ "success": true, "message": "Lesson marked as completed", "enrollment": { "progress": 25 } }
```

#### PUT /api/enrollments/:userId/course/:courseId/complete
- Auth: Required (`isSelfOrAdmin`)
- Response (200):
```json
{
  "success": true,
  "message": "Course completed successfully! You can now generate your certificate.",
  "enrollment": { "progress": 100, "averageScore": 84 }
}
```

#### POST /api/progress/:userId/quiz/:quizId/attempt
- Auth: Required (`isSelfOrAdmin`)
- Request:
```json
{
  "answers": [
    { "questionId": "...", "selectedChoiceId": "..." }
  ]
}
```
- Response (201):
```json
{
  "success": true,
  "message": "Quiz submitted",
  "results": { "passed": true, "percentage": 80, "correctAnswers": 4, "totalQuestions": 5 },
  "progress": { "_id": "..." }
}
```

#### GET /api/progress/:userId/quiz/:quizId/attempts
- Auth: Required (`isSelfOrAdmin`)
- Response (200):
```json
{ "success": true, "attempts": [] }
```

#### GET /api/progress/attempt/:attemptId
- Auth: Required
- Response (200):
```json
{ "success": true, "attempt": { "_id": "...", "answers": [] } }
```

#### GET /api/progress/:userId/course/:courseId
- Auth: Required (`isSelfOrAdmin`)
- Response (200):
```json
{ "success": true, "attempts": [] }
```

### Certificates

#### POST /api/certificates/:userId/course/:courseId
- Auth: Required (`isSelfOrAdmin`)
- Response (200):
```json
{ "success": true, "certificate": { "certificateNumber": "CERT-...", "certificateUrl": "https://..." } }
```

#### GET /api/certificates/:userId/course/:courseId
- Auth: Required (`isSelfOrAdmin`)
- Response (200):
```json
{ "success": true, "certificate": { "certificateNumber": "CERT-..." } }
```

#### GET /api/certificates/:userId
- Auth: Required (`isSelfOrAdmin`)
- Response (200):
```json
{ "success": true, "certificates": [] }
```

### AI Explanations

#### GET /api/ai/:attemptId/explanations
- Auth: Required
- Query (optional): `model`
- Response (200):
```json
{
  "success": true,
  "attemptId": "...",
  "modelUsed": "gpt-4o-mini",
  "explanations": [
    {
      "questionId": "...",
      "questionText": "...",
      "selectedChoice": { "id": "...", "text": "..." },
      "correctChoice": { "id": "...", "text": "..." },
      "aiExplanation": "..."
    }
  ]
}
```

## 2.8 Upload APIs

### POST /api/upload/image
- Auth: Required
- Content type: `multipart/form-data` (field `image`) or base64 JSON
- Request JSON fallback:
```json
{ "file": "data:image/png;base64,...", "folder": "courses" }
```
- Response (200):
```json
{ "success": true, "url": "https://...", "publicId": "courses/..." }
```

### DELETE /api/upload/image
- Auth: Required
- Request:
```json
{ "publicId": "courses/..." }
```
- Response (200):
```json
{ "success": true, "message": "Image deleted successfully" }
```

## 2.9 Loan APIs

### POST /api/loans/apply
- Auth: Required (`farmerOnly` + eligibility middleware)
- Request:
```json
{
  "amount": 100000,
  "categoryId": "<loan-category-id>",
  "planId": "<plan-id>"
}
```
- Response (201):
```json
{
  "_id": "...",
  "status": "Pending",
  "amount": 100000,
  "monthlyInstallment": 9166.67,
  "remainingBalance": 110000
}
```

### GET /api/loans/my
- Auth: Required (`farmerOnly`)
- Response (200):
```json
{ "success": true, "loans": [] }
```

### GET /api/loans/admin
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "loans": [] }
```

### PUT /api/loans/approve/:id
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "message": "Loan Approved", "loan": { "status": "Active" } }
```

### PUT /api/loans/reject/:id
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "message": "Loan Rejected", "loan": { "status": "Rejected" } }
```

### POST /api/loans/repay/:loanId
- Auth: Required
- Request:
```json
{ "amount": 5000, "paidDate": "2026-04-11T10:30:00.000Z" }
```
- Response (200):
```json
{ "message": "Payment Successful", "loan": { "remainingBalance": 95000 }, "repayment": { "amount": 5000 } }
```

### GET /api/loans/repay/:loanId
- Auth: Required
- Response (200):
```json
{ "success": true, "repayments": [] }
```

## 2.10 Loan Category APIs

### POST /api/loan-categories/
- Auth: Required (`adminOnly`)
- Request:
```json
{ "name": "Crop Loan", "code": "CROP", "description": "For cultivation" }
```
- Response (201):
```json
{ "success": true, "data": { "_id": "...", "name": "Crop Loan" } }
```

### GET /api/loan-categories/
- Auth: None
- Response (200):
```json
{ "success": true, "data": [] }
```

### GET /api/loan-categories/:id
- Auth: None
- Response (200):
```json
{ "success": true, "data": { "_id": "...", "name": "Crop Loan" } }
```

### PUT /api/loan-categories/:id
- Auth: Required (`adminOnly`)
- Request:
```json
{ "name": "Updated Crop Loan", "description": "Updated" }
```
- Response (200):
```json
{ "success": true, "data": { "_id": "...", "name": "Updated Crop Loan" } }
```

### DELETE /api/loan-categories/:id
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "message": "Loan category deleted" }
```

## 2.11 Plan APIs

### POST /api/plans/
- Auth: Required (`adminOnly`)
- Request:
```json
{
  "planName": "Starter Plan",
  "interestRate": 10,
  "interestType": "flat",
  "duration": 12,
  "durationType": "months",
  "paymentFrequency": "monthly",
  "minLoanAmount": 10000,
  "maxLoanAmount": 500000
}
```
- Response (201):
```json
{ "success": true, "data": { "_id": "...", "planName": "Starter Plan" } }
```

### GET /api/plans/
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "data": [] }
```

### GET /api/plans/active
- Auth: Required
- Response (200):
```json
{ "success": true, "data": [] }
```

### GET /api/plans/:id
- Auth: Required
- Response (200):
```json
{ "success": true, "data": { "_id": "...", "planName": "Starter Plan" } }
```

### PUT /api/plans/:id
- Auth: Required (`adminOnly`)
- Request:
```json
{ "interestRate": 12 }
```
- Response (200):
```json
{ "success": true, "data": { "_id": "...", "interestRate": 12 } }
```

### PATCH /api/plans/:id/toggle-status
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "data": { "_id": "...", "isActive": false } }
```

### DELETE /api/plans/:id
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "message": "Plan deleted" }
```

## 2.12 Weather APIs

### GET /api/weather/
- Auth: None
- Query: `city`
- Example: `/api/weather?city=Colombo`
- Response (200):
```json
{
  "success": true,
  "city": "Colombo",
  "temperature": 30,
  "description": "clear sky",
  "humidity": 70,
  "windSpeed": 3.4,
  "iconUrl": "https://openweathermap.org/img/wn/01d@2x.png"
}
```

### GET /api/weather/forecast
- Auth: None
- Query: `city`
- Response (200):
```json
{ "success": true, "city": "Colombo", "forecast": [] }
```

### GET /api/weather/cities
- Auth: None
- Response (200):
```json
{ "success": true, "cities": ["Colombo", "Kandy", "Galle"] }
```

## 2.13 Support Ticket APIs

### POST /api/support-tickets/
- Auth: Required (`farmerOnly`)
- Request:
```json
{ "subject": "Loan issue", "message": "Need help with repayment schedule" }
```
- Response (201):
```json
{ "success": true, "data": { "_id": "...", "status": "Open" } }
```

### GET /api/support-tickets/my
- Auth: Required (`farmerOnly`)
- Response (200):
```json
{ "success": true, "data": [] }
```

### PUT /api/support-tickets/my/:ticketId/notification/read
- Auth: Required (`farmerOnly`)
- Response (200):
```json
{ "success": true, "message": "Notification marked as read" }
```

### PUT /api/support-tickets/:ticketId
- Auth: Required (`farmerOnly`)
- Request:
```json
{ "subject": "Updated subject", "message": "Updated details" }
```
- Response (200):
```json
{ "success": true, "data": { "_id": "...", "status": "Open" } }
```

### DELETE /api/support-tickets/:ticketId
- Auth: Required (`farmerOnly`)
- Response (200):
```json
{ "success": true, "message": "Ticket deleted successfully" }
```

### GET /api/support-tickets/
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "data": [] }
```

### PUT /api/support-tickets/:ticketId/reply
- Auth: Required (`adminOnly`)
- Request:
```json
{ "reply": "We have resolved your issue." }
```
- Response (200):
```json
{ "success": true, "data": { "status": "Resolved" } }
```

### PUT /api/support-tickets/:ticketId/status
- Auth: Required (`adminOnly`)
- Request:
```json
{ "status": "In Progress" }
```
- Response (200):
```json
{ "success": true, "data": { "status": "In Progress" } }
```

## 2.14 Ticket Service Rating APIs

### POST /api/ticket-ratings/
- Auth: Required (`farmerOnly`)
- Request:
```json
{ "ticketId": "<ticket-id>", "rating": 5, "comment": "Great support" }
```
- Response (201):
```json
{ "success": true, "data": { "_id": "...", "rating": 5 } }
```

### GET /api/ticket-ratings/ticket/:ticketId
- Auth: Required
- Response (200):
```json
{ "success": true, "data": { "ticketId": "...", "rating": 5 } }
```

### DELETE /api/ticket-ratings/ticket/:ticketId
- Auth: Required
- Response (200):
```json
{ "success": true, "message": "Ticket rating deleted" }
```

### GET /api/ticket-ratings/
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "data": [] }
```

## 2.15 Platform Service Rating APIs

### GET /api/platform-ratings/testimonials
- Auth: None
- Response (200):
```json
{ "success": true, "data": [] }
```

### GET /api/platform-ratings/public
- Auth: None
- Response (200):
```json
{ "success": true, "data": [] }
```

### POST /api/platform-ratings/
- Auth: Required (`farmerOnly`)
- Request:
```json
{ "rating": 4, "comment": "Useful platform" }
```
- Response (201):
```json
{ "success": true, "data": { "_id": "...", "rating": 4 } }
```

### GET /api/platform-ratings/my
- Auth: Required (`farmerOnly`)
- Response (200):
```json
{ "success": true, "data": { "rating": 4 } }
```

### DELETE /api/platform-ratings/my
- Auth: Required (`farmerOnly`)
- Response (200):
```json
{ "success": true, "message": "Platform rating deleted" }
```

### GET /api/platform-ratings/
- Auth: Required (`adminOnly`)
- Response (200):
```json
{ "success": true, "data": [] }
```

### GET /api/platform-ratings/:userId
- Auth: Required (`adminOnly` + ObjectId param)
- Response (200):
```json
{ "success": true, "data": { "userId": "...", "rating": 4 } }
```

---

## 3. Example cURL Requests

### Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret123"}'
```

### Create Course (Admin)
```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Soil Basics","description":"Intro","isPublished":false}'
```

### Apply Loan (Farmer)
```bash
curl -X POST http://localhost:5000/api/loans/apply \
  -H "Authorization: Bearer <farmer-token>" \
  -H "Content-Type: application/json" \
  -d '{"amount":100000,"categoryId":"<categoryId>","planId":"<planId>"}'
```

### Create Support Ticket (Farmer)
```bash
curl -X POST http://localhost:5000/api/support-tickets \
  -H "Authorization: Bearer <farmer-token>" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Need Help","message":"Issue details"}'
```

---

## 4. Notes
- Keep secrets in `.env`; never commit real credentials.
- Some endpoints are role-restricted by middleware (`adminOnly`, `farmerOnly`, `isSelfOrAdmin`).
- API examples show representative payloads; exact optional fields can evolve with controller/model updates.
