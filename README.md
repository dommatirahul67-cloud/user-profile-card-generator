# ProfileForge — User Profile Card Generator

A full-stack web application that allows users to create dynamic profile cards with personal information, a short bio, skills, and social links.

## 🌐 Live Demo

- **Frontend:** https://user-profile-card-generator-fronten.vercel.app/
- **Backend Health Check:** https://user-profile-card-generator-jui2.onrender.com/api/health

## ✨ Features

- Create and display profile cards dynamically.
- Add a name, bio, skills, and avatar URL.
- Include GitHub, LinkedIn, and portfolio links.
- Save profile information through a backend API.
- Store profile data using Supabase.
- Responsive, modern user interface.

## 🛠️ Tech Stack

**Frontend:** HTML, CSS, JavaScript  
**Backend:** Node.js, Express.js  
**Database:** Supabase  
**Deployment:** Vercel (frontend), Render (backend)

## 📁 Project Structure

```text
user-profile-card-generator/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend/
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
└── .gitignore
```

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/dommatirahul67-cloud/user-profile-card-generator.git
cd user-profile-card-generator
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder with your own Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=5000
```

Never publish your actual credentials or service-role key.

### 3. Start the backend

```bash
npm start
```

### 4. Run the frontend

Open `frontend/index.html` using VS Code Live Server. Ensure the frontend API URL points to your running backend.

## 🗄️ Database

Supabase is used to store profile information. Configure the required database table and columns to match the backend implementation.

## 🎯 Project Objective

To provide a simple and accessible way to generate profile cards using a clean frontend, a REST API, and a cloud database.

---

**Developed as part of a Full Stack Development internship project.**
