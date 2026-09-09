# BiblioTech AI

BiblioTech AI is an intelligent book inventory and recommendation SaaS platform. It features role-based access control, a modern dashboard UI, AI-powered book summaries generated via the Google Gemini API, and a robust **relational PostgreSQL database backend powered by raw, high-performance SQL queries**.

## Architecture

The project is built using a modern full-stack JavaScript & Relational SQL architecture:
- **Frontend**: React.js (Vite), Tailwind CSS, Context API for state management.
- **Backend**: Node.js, Express.js, PostgreSQL (using raw parameterized SQL via the `pg` pool driver), JWT for authentication.
- **Data Modeling & Analytics**: Relational schema DDL with Primary/Foreign Keys, `ON DELETE CASCADE` rules, B-Tree indexes, and complex analytical SQL queries incorporating `LEFT JOIN` aggregations, `GROUP BY`, subqueries, and `DENSE_RANK()` Window Functions.
- **AI Integration**: `@google/genai` SDK using `gemini-2.5-flash` enriched with live PostgreSQL analytical metrics.

## Relational Database Schema & Features

- **Normalized Tables**:
  - `users`: User authentication, hashed passwords (bcrypt), role-based control (`admin` / `user`).
  - `books`: Catalog records with constraints, stock levels, and AI summaries.
  - `inventory_logs`: Dynamic inventory transaction logging via PostgreSQL transactions (`BEGIN`, `COMMIT`, `ROLLBACK`).
- **Complex SQL Analytics**:
  - **Window Functions**: `DENSE_RANK() OVER (PARTITION BY genre ORDER BY stock DESC)` for genre availability ranking.
  - **Aggregations & Subqueries**: Inventory adjustment metrics joined dynamically.

## Prerequisites
- Node.js (v18+)
- PostgreSQL (Running locally or via cloud PostgreSQL like Supabase/Neon/RDS)
- Gemini API Key

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Update `.env` with your actual PostgreSQL connection details (`PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGPORT` or `DATABASE_URL`), JWT Secret, and Gemini API Key.

Seed the database with schema DDL, default users, books, and inventory logs:
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
| GET    | `/api/books`           | Get books with PostgreSQL SQL Analytics      | Public       |
| POST   | `/api/books`           | Add a new book (with inventory logging)      | Admin Only   |
| PUT    | `/api/books/:id`       | Update a book                                | Admin Only   |
| DELETE | `/api/books/:id`       | Delete a book                                | Admin Only   |
| POST   | `/api/books/summarize` | Generate AI summary enriched with SQL metrics| Auth Users   |

## Credentials for Testing
- **Admin**: `admin` / `admin123`
- **User**: `testuser` / `user123`

## Key Features
- **Role-Based Views**: Admins can add/update/delete books. Regular users can browse catalog and generate summaries.
- **PostgreSQL & Raw SQL Engine**: Zero ORM overhead, fully parameterized SQL queries protecting against SQL injection.
- **Analytical Insights**: Dynamic window functions and lending metrics seamlessly passed to Gemini AI for enriched summary generation.
- **Modern UI**: Clean, responsive design built with React & Tailwind CSS (requires 0 changes to consume PostgreSQL backend).
