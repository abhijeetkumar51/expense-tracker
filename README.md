# 📊 Full-Stack Expense Tracker

![GitHub repo size](https://img.shields.io/github/repo-size/yourusername/expense-tracker)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)

A comprehensive, full-stack personal finance application designed to help users track their income, monitor expenses against custom budgets, and visualize their financial health. Built with a modern React frontend and a robust Node.js/PostgreSQL backend, this project emphasizes data integrity, security, and developer experience through containerization.

## 🌐 Live Demo

- **Live URL:** https://expense-tracker-ten-murex-80.vercel.app

*(Note to Self: Add a GIF or screenshot of the Dashboard and Transactions page here)*

---

## ✨ Features

- **Secure Authentication:** User signup and login utilizing JSON Web Tokens (JWT) and bcrypt password hashing.
- **Financial Categorization:** Create custom income and expense categories to organize your cash flow.
- **Transaction Ledger:** Full CRUD capabilities for transactions, featuring dynamic filtering by date range, type, and category.
- **Smart Budgeting:** Set monthly limits on expense categories. The dashboard automatically flags and highlights categories that go over budget.
- **Analytics Dashboard:** Visual representation of financial data using interactive Recharts (Pie charts for category breakdown, Bar charts for budget vs. actual spending).
- **Containerized Environment:** Fully dockerized with multi-stage builds for seamless local development and production readiness.
- **CI/CD Pipeline:** Automated GitHub Actions workflow to validate builds and syntax on every code push.

---

## 🛠️ Tech Stack

| Domain | Technologies Used |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, Recharts, React Router, Axios |
| **Backend** | Node.js, Express.js, JWT, bcrypt |
| **Database** | PostgreSQL (Hosted on Supabase) |
| **DevOps** | Docker, Docker Compose, Nginx, GitHub Actions |

---

## 🏗️ Architecture

The application follows a standard client-server architecture. The frontend is a Single Page Application (SPA) that communicates with a RESTful Express API. The API is the sole orchestrator of data, securely interacting with the PostgreSQL database. In a production/containerized environment, the React app is built statically and served by a highly performant Nginx web server.

```mermaid
graph LR
    Client[Browser] -->|HTTP / REST| Nginx[Nginx Web Server\nReact Static Files]
    Nginx -->|API Requests| Express[Node.js / Express API]
    Express -->|SQL Queries| Postgres[(PostgreSQL\nSupabase)]
    
    subgraph Docker Compose
    Nginx
    Express
    end
```

---

## 📡 API Endpoints

All endpoints (except auth routes) require a valid JWT passed in the `Authorization: Bearer <token>` header.

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/signup` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT | ❌ |
| `GET` | `/api/auth/me` | Fetch logged-in user details | 🔒 |
| `GET` | `/api/categories` | Get all categories for user | 🔒 |
| `POST` | `/api/categories` | Create a new category | 🔒 |
| `PUT` | `/api/categories/:id` | Update an existing category | 🔒 |
| `DELETE` | `/api/categories/:id` | Delete a category | 🔒 |
| `GET` | `/api/transactions` | Get transactions (supports query filters) | 🔒 |
| `POST` | `/api/transactions` | Log a new transaction | 🔒 |
| `PUT` | `/api/transactions/:id` | Update a transaction | 🔒 |
| `DELETE` | `/api/transactions/:id`| Delete a transaction | 🔒 |
| `GET` | `/api/budgets` | Get all budgets for user | 🔒 |
| `POST` | `/api/budgets` | Create/Update (Upsert) a budget | 🔒 |
| `DELETE` | `/api/budgets/:id` | Delete a budget | 🔒 |
| `GET` | `/api/dashboard/summary`| Aggregated analytics for the dashboard | 🔒 |

---

## 💻 Local Setup & Installation

### Prerequisites
- Node.js (v18+)
- Docker Desktop (if running via containers)
- A Supabase account (or local PostgreSQL instance)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/expense-tracker.git
cd expense-tracker
```

### 2. Environment Variables
You will need to create a `.env` file in the `server/` directory.

**`server/.env`**
```env
PORT=5000
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-SUPABASE-REF].supabase.co:5432/postgres
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Running with Docker Compose (Recommended)
This approach spins up both the Node API and the Nginx-served React app automatically.

```bash
# Build and start the containers in detached mode
docker-compose up -d --build

# The Frontend will be available at http://localhost:3000
# The Backend API will be available at http://localhost:5000
```

### 4. Running without Docker (Standard Local Dev)
If you prefer to run the dev servers natively:

**Terminal 1 (Backend):**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm install
npm run dev
```
*Frontend will be available at http://localhost:5173*

---

## 🧪 Testing

The backend includes several automated Node.js test scripts using Axios to validate API behavior and database integration end-to-end. Ensure your development server is running (`npm run dev`) before executing tests.

```bash
cd server
node test-auth.js      # Tests JWT generation and protected route access
node test-crud.js      # Tests Creation, Reading, Updating, Deleting of resources
node test-budgets.js   # Tests budget upsert logic and threshold triggers
node test-e2e.js       # Simulates a full user journey (Signup -> Dashboard)
```

---

## 🧠 Key Technical Decisions

- **JWT over Session Cookies:** I opted for stateless JWT authentication to decouple the frontend from the backend. This architecture allows the API to remain purely stateless, making it easier to scale horizontally and potentially serve mobile clients (React Native) in the future without CORS/cookie complexities.
- **PostgreSQL over MongoDB:** Financial data is inherently relational. Transactions belong to categories, which belong to users. Using a relational database like PostgreSQL ensures strict data integrity (using Foreign Keys and Constraints) and allows for powerful, efficient analytical queries (e.g., aggregating total spent per category using `SUM()` and `GROUP BY`) natively in the database layer rather than in application memory.
- **Docker Multi-Stage Builds:** For the frontend container, I utilized a multi-stage Dockerfile. Stage 1 pulls a Node image purely to compile the React code (`npm run build`). Stage 2 pulls a lightweight Nginx Alpine image and only copies the static compiled files. This keeps the final production image incredibly small, secure, and fast, without carrying the bloat of `node_modules` into production.

---

## 🚀 Future Improvements

- **Export to CSV/PDF:** Allow users to download their monthly transaction ledgers for tax purposes.
- **Recurring Transactions:** Automate fixed monthly expenses (like Rent or Netflix subscriptions).
- **Dark Mode UI:** Implement a system-aware dark mode toggle using Tailwind's dark class utilities.
- **Email Notifications:** Integrate SendGrid/Nodemailer to alert users immediately when they cross a budget threshold.

---

## 📄 License & Author

This project is licensed under the MIT License.

**Author:** [Abhijeet Chaudhary](https://github.com/yourusername)  
Feel free to reach out if you have any questions or want to collaborate!
