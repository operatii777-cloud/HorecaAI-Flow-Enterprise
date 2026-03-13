# HorecaAI Flow - Enterprise ERP

A comprehensive Full-Stack solution for Restaurant & Hospitality management.

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts, AG Grid
- **Backend**: Node.js, Express, Socket.io
- **Database**: SQLite (via Prisma ORM)
- **AI Integration**: Gemini API (Menu Engineering, Sommelier, Pricing)

## Features
- **POS**: Advanced Point of Sale with table map, drive-thru, and delivery modes.
- **KDS**: Real-time Kitchen Display System with routing by station.
- **Inventory**: Smart stock tracking, recipes, waste logs, and supplier management (NIR).
- **CRM**: Client loyalty, history, and digital wallet generation.
- **Admin**: Financials, P&L, Staff Scheduling, Payroll, and Audit Logs.
- **Apps**: Driver App, Customer Kiosk, Feedback Terminal.
- **Compliance**: HACCP logs, Cleaning schedules, and Maintenance tracking.

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn

## Installation & Setup

### 1. Start the Backend Server
The backend manages the SQLite database and real-time WebSocket connections.

```bash
cd backend
npm install
npx prisma db push  # Initializes the SQLite database (dev.db)
npm run dev         # Starts server on http://localhost:3000
```

### 2. Start the Frontend Client
Open a new terminal window in the project root.

```bash
# Install dependencies
npm install

# Start the development server
npm start # or npm run dev
```
The application will be available at `http://localhost:1234` (or similar port).

### 3. First Run Configuration
1. Open the application in your browser.
2. You will be greeted by the **Setup Wizard**.
3. Select **"Demo Data"** to populate the system with sample products, tables, and staff.
4. Log in using the default Admin PIN: `0000`.

## Key Roles & PINs
- **Admin**: `0000` (Full Access)
- **Manager**: `1111` (Ops & Reports)
- **Chef**: `2222` (Kitchen Display)
- **Waiter**: `1111` (POS)
- **Driver**: `3333` (Delivery App)

## Troubleshooting
- **Database Error**: If you encounter database issues, delete `backend/prisma/dev.db` and run `npx prisma db push` to reset.
- **Port Conflicts**: Ensure port 3000 is free for the backend.
