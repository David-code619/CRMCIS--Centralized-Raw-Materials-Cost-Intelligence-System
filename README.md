# CRMCIS - Centralized Raw Materials Cost Intelligence System

## Overview
A comprehensive inventory management system for raw materials with multi-branch support, real-time tracking, and advanced reporting capabilities.

## Features
- User authentication with role-based access (Super Admin, Branch Manager, Inventory Officer)
- Multi-branch inventory management
- Material catalog management
- Purchase tracking and cost analysis
- Stock adjustments and usage logging
- Transfer requests between branches
- Real-time notifications
- Comprehensive reporting and analytics
- Dark/Light theme support

## Tech Stack
### Frontend
- React 19 with Vite
- Tailwind CSS for styling
- React Router for navigation
- Context API for state management

### Backend
- Node.js with Express
- Prisma ORM with PostgreSQL
- JWT authentication
- CORS enabled

### Deployment
- Frontend: Vercel
- Backend: Render
- Database: Neon (PostgreSQL)

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database

### Setup

1. Clone the repository:
```bash
git clone https://github.com/David-code619/CRMCIS--Centralized-Raw-Materials-Cost-Intelligence-System.git
cd crmcis
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Set up environment variables:

Backend (.env):
```
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_secure_jwt_secret"
FRONTEND_URL="http://localhost:5173"  # For development
NODE_ENV="development"
```

Frontend (.env):
```
VITE_API_URL="http://localhost:3000"
```

5. Set up the database:
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

6. Start the development servers:

Backend:
```bash
npm run dev
```

Frontend:
```bash
cd ../frontend
npm run dev
```

## Usage

1. Access the application at `http://localhost:5173`
2. Create a super admin account or use seeded data
3. Log in and start managing your inventory

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variable: `VITE_API_URL=https://your-render-backend-url.onrender.com`
3. Deploy

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL=https://your-vercel-app.vercel.app`
   - `NODE_ENV=production`
3. Deploy

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License
MIT License