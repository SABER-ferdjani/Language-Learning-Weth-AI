# Language Learning With AI

A full-stack web platform that teaches English using an AI tutor. The AI supervises learning across the four core language skills: Writing, Reading, Listening, and Speaking, and evaluates the student's performance with a CEFR level.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or MongoDB Atlas)
- An OpenAI API Key

## Getting Started

### 1. Backend Setup

Open a terminal and navigate to the `backend` folder:

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder and add the following variables (you can copy from `.env.example`):

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/language-learning
JWT_SECRET=your_jwt_secret_here
OPENAI_API_KEY=your_openai_api_key_here
CLIENT_URL=http://localhost:5173
```

Start the backend server (using Hono):

```bash
node server.js
# Or if you have nodemon installed globally:
# nodemon server.js
```

### 2. Frontend Setup

Open a new terminal and navigate to the `frontend` folder:

```bash
cd frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend will run at `http://localhost:5173`. You can register a new user and start learning!

## Technologies Used

- **Backend:** Node.js, Hono, MongoDB (Mongoose), JWT, bcrypt, OpenAI SDK.
- **Frontend:** React, Vite, React Router, Axios, Vanilla CSS (RTL support for Arabic).
