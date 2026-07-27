# BiblioTech AI

BiblioTech AI is an intelligent book inventory and recommendation SaaS platform. It features role-based access control, a modern dashboard UI, and AI-powered book summaries generated via the Google Gemini API.

## Architecture

The project is built using a modern full-stack JavaScript architecture:
- **Frontend**: React.js (Vite), Tailwind CSS, Context API for state management.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT for authentication.
- **AI Integration**: `@google/genai` SDK using `gemini-2.5-flash` for book summaries.

## Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or via MongoDB Atlas)
- Gemini API Key

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Update `.env` with your actual MongoDB URI, JWT Secret, and Gemini API Key.

Seed the database with initial admin and test user credentials:
```bash
npm run seed
```

Start the backend server:
```bash
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
```

Start the frontend server:
```bash
npm run dev
```

## API Endpoints

| Method | Endpoint               | Description                                  | Access       |
|--------|------------------------|----------------------------------------------|--------------|
| POST   | `/api/auth/register`   | Register a new user                          | Public       |
| POST   | `/api/auth/login`      | Authenticate a user and get JWT              | Public       |
| GET    | `/api/books`           | Get all books                                | Public       |
| POST   | `/api/books`           | Add a new book                               | Admin Only   |
| PUT    | `/api/books/:id`       | Update a book                                | Admin Only   |
| DELETE | `/api/books/:id`       | Delete a book                                | Admin Only   |
| POST   | `/api/books/summarize` | Generate AI summary for a book               | Auth Users   |

## Credentials for Testing
- **Admin**: `admin` / `admin123`
- **User**: `testuser` / `user123`

## Features
- **Role-Based Views**: Admins can add/delete books. Regular users can only browse and generate summaries.
- **AI Summaries**: Click "✨ Generate AI Summary" on any book card to get a 3-sentence summary of the book.
- **Modern UI**: Clean, responsive design built with Tailwind CSS.
