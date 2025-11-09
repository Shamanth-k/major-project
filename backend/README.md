# Aetherium Guard Backend API

Complete backend server for Aetherium Guard - Cyber & Legal Simulations platform with user management, game progress tracking, AI-powered assessments, and comprehensive analytics.

## 🚀 Features

- **User Authentication & Authorization**

  - JWT-based authentication
  - Role-based access control (User/Admin)
  - Secure password hashing with bcrypt

- **Game Progress Tracking**

  - Track progress across all 6 game types
  - Store completed levels and scores
  - Resume progress on login
  - Game-specific data storage

- **AI-Powered Assessments**

  - Pre and post-assessments using Google Gemini API
  - Automated question generation
  - Score calculation and comparison
  - Progress tracking

- **Comprehensive Analytics**

  - User performance analytics
  - Pre/post assessment comparison
  - Skill improvement tracking
  - AI-generated insights
  - Badge system

- **Admin Dashboard**
  - System-wide analytics
  - User management
  - Game statistics
  - Activity monitoring

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Google Gemini API key
- npm or yarn

## 🛠️ Installation

1. **Navigate to the backend directory:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create environment file:**

   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables in `.env`:**

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database (Choose one)
   # Local MongoDB:
   MONGODB_URI=mongodb://localhost:27017/aetherium-guard

   # MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aetherium-guard

   # JWT Secret (Generate a strong random string)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d

   # Google Gemini API
   GEMINI_API_KEY=your-gemini-api-key-here

   # CORS Origin (Frontend URL)
   CORS_ORIGIN=http://localhost:5173

   # Admin Credentials
   ADMIN_EMAIL=admin@aetherium.io
   ADMIN_PASSWORD=Admin@123456
   ```

5. **Start MongoDB (if using local):**

   ```bash
   # Windows (if installed as service)
   net start MongoDB

   # Or run manually
   mongod
   ```

6. **Seed admin user:**

   ```bash
   npm run seed
   ```

7. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.ts   # Authentication logic
│   │   ├── gameProgress.controller.ts
│   │   ├── assessment.controller.ts
│   │   ├── analytics.controller.ts
│   │   └── admin.controller.ts
│   ├── middleware/
│   │   ├── auth.ts              # JWT authentication
│   │   └── errorHandler.ts      # Global error handling
│   ├── models/
│   │   ├── User.ts              # User schema
│   │   ├── GameProgress.ts      # Game progress schema
│   │   ├── Assessment.ts        # Assessment schema
│   │   └── Analytics.ts         # Analytics schema
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── gameProgress.routes.ts
│   │   ├── assessment.routes.ts
│   │   ├── analytics.routes.ts
│   │   └── admin.routes.ts
│   ├── services/
│   │   ├── gemini.service.ts    # AI assessment generation
│   │   └── analytics.service.ts # Analytics calculations
│   ├── scripts/
│   │   └── seedAdmin.ts         # Admin user seeding
│   └── server.ts                # Main server file
├── .env.example                 # Environment template
├── package.json
└── tsconfig.json
```

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint    | Description         | Auth Required |
| ------ | ----------- | ------------------- | ------------- |
| POST   | `/register` | Register new user   | No            |
| POST   | `/login`    | Login user          | No            |
| GET    | `/profile`  | Get current user    | Yes           |
| PUT    | `/profile`  | Update user profile | Yes           |

### Game Progress (`/api/progress`)

| Method | Endpoint              | Description                | Auth Required |
| ------ | --------------------- | -------------------------- | ------------- |
| GET    | `/`                   | Get all game progress      | Yes           |
| GET    | `/:gameType`          | Get specific game progress | Yes           |
| PUT    | `/:gameType`          | Update game progress       | Yes           |
| POST   | `/:gameType/complete` | Complete a level           | Yes           |
| DELETE | `/:gameType/reset`    | Reset game progress        | Yes           |

### Assessments (`/api/assessments`)

| Method | Endpoint            | Description                    | Auth Required |
| ------ | ------------------- | ------------------------------ | ------------- |
| POST   | `/generate`         | Generate new assessment        | Yes           |
| POST   | `/submit`           | Submit assessment answers      | Yes           |
| GET    | `/`                 | Get all assessments            | Yes           |
| GET    | `/:assessmentId`    | Get specific assessment        | Yes           |
| GET    | `/:gameType/:level` | Get assessments for game/level | Yes           |
| DELETE | `/:assessmentId`    | Delete assessment              | Yes           |

### Analytics (`/api/analytics`)

| Method | Endpoint     | Description                 | Auth Required |
| ------ | ------------ | --------------------------- | ------------- |
| GET    | `/`          | Get user analytics          | Yes           |
| GET    | `/:gameType` | Get game-specific analytics | Yes           |
| POST   | `/update`    | Update analytics            | Yes           |

### Admin (`/api/admin`)

| Method | Endpoint         | Description           | Auth Required |
| ------ | ---------------- | --------------------- | ------------- |
| GET    | `/dashboard`     | Get dashboard stats   | Admin         |
| GET    | `/analytics`     | Get system analytics  | Admin         |
| GET    | `/users`         | Get all users         | Admin         |
| GET    | `/users/:userId` | Get user details      | Admin         |
| PUT    | `/users/:userId` | Update user           | Admin         |
| DELETE | `/users/:userId` | Delete user           | Admin         |
| GET    | `/progress`      | Get all game progress | Admin         |
| GET    | `/assessments`   | Get all assessments   | Admin         |

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Example:

```javascript
fetch("http://localhost:5000/api/progress", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

## 📊 Database Models

### User

- email, password, role, level, badges
- Tracks user authentication and profile

### GameProgress

- userId, gameType, level, completedLevels
- Stores game progression data
- Tracks time spent and scores

### Assessment

- userId, gameType, level, assessmentType (pre/post)
- Stores assessment questions and answers
- Calculates scores

### Analytics

- userId, gameType, level
- Pre/post assessment comparison
- Improvement metrics
- AI-generated insights
- Badges earned

## 🤖 AI Integration

The backend uses Google Gemini API for:

1. **Assessment Generation**

   - Generates contextual questions based on game type and level
   - Creates both pre and post-assessment questions
   - Ensures educational quality

2. **Analytics Insights**
   - Generates personalized feedback
   - Identifies learning patterns
   - Provides actionable recommendations

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables for Production

Make sure to set secure values for:

- `JWT_SECRET` - Use a strong random string
- `MONGODB_URI` - Production database URL
- `GEMINI_API_KEY` - Your API key
- `NODE_ENV=production`

### Recommended Hosting

- **Backend**: Heroku, DigitalOcean, AWS EC2, Railway
- **Database**: MongoDB Atlas (free tier available)

### MongoDB Atlas Setup

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create database user
4. Whitelist IP addresses (or use 0.0.0.0/0 for development)
5. Get connection string and update `MONGODB_URI`

## 📝 Example Usage

### Register User

```javascript
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "role": "user"
}
```

### Generate Assessment

```javascript
POST /api/assessments/generate
Headers: { "Authorization": "Bearer <token>" }
{
  "gameType": "phishing",
  "level": 1,
  "assessmentType": "pre"
}
```

### Submit Assessment

```javascript
POST /api/assessments/submit
Headers: { "Authorization": "Bearer <token>" }
{
  "assessmentId": "assessment_id_here",
  "answers": [1, 2, 0, 3, 1],
  "timeSpent": 300
}
```

### Update Game Progress

```javascript
PUT /api/progress/phishing
Headers: { "Authorization": "Bearer <token>" }
{
  "currentLevel": 2,
  "completedLevels": [1],
  "totalScore": 95,
  "timeSpent": 450
}
```

## 🐛 Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access for MongoDB Atlas

### JWT Token Issues

- Ensure `JWT_SECRET` is set
- Check token expiration
- Verify Authorization header format

### Gemini API Issues

- Verify API key is valid
- Check API quota/limits
- Fallback to mock data if API fails

## 📄 License

This project is licensed under the ISC License.

## 👥 Support

For issues and questions:

- Create an issue in the repository
- Contact the development team

---

Built with ❤️ for Aetherium Guard
