# 🎬 QuickShow Frontend — React & Vite Application

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live_Frontend-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://quickshow-frontend.vercel.app)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

The official frontend application for the **QuickShow** cinema management and ticket booking platform. Built with **React 19**, **Vite**, and **Tailwind CSS**, featuring authentication via **Clerk**, real-time seat matrices, dynamic islandwide showtime feeds, and live cinema bookings.

---

## 🌐 Live Production Application

- **Live Frontend URL:** **[https://quickshow-frontend.vercel.app](https://quickshow-frontend.vercel.app)**
- **Connected Backend API:** **[https://quickshow-backend-plum.vercel.app/api](https://quickshow-backend-plum.vercel.app/api)**

---

## 🚀 Key Frontend Features

1. **Islandwide Cinema Network**: Real-time cinema listings for Scope Cinemas, Savoy 3D, PVR One Galle Face, and Kandy City Centre.
2. **Interactive Seat Matrix**: Real-time seat layouts with VIP recliners, regular seats, and instant price calculations in LKR.
3. **User Isolation**: Secure and isolated views for logged-in user profile bookings, digital entrance tickets, and favourites.
4. **Admin Showtime Scheduling Panel**: Dynamic Sri Lankan cinema slots (10:00 AM, 01:00 PM, 04:00 PM, 07:15 PM, 10:15 PM) with automatic movie runtime calculations.
5. **Interactive Concierge Chatbot**: Built-in cinema concierge assisting users with showtimes, ticket queries, and concession ordering.

---

## 🛠️ Tech Stack & Dependencies

- **Framework**: React 19 (`react`, `react-dom`)
- **Build Tool**: Vite (`vite`, `@vitejs/plugin-react`)
- **Styling**: Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`)
- **Authentication**: Clerk React (`@clerk/clerk-react`)
- **Routing**: React Router v7 (`react-router-dom`)
- **Icons**: Lucide React (`lucide-react`) & Heroicons (`@heroicons/react`)
- **Toasts**: React Hot Toast (`react-hot-toast`)

---

## ⚙️ Environment Variables

Create a `.env` file in the `client/` directory with the following variables:

```env
# Backend API Base URL
VITE_API_BASE_URL=https://quickshow-backend-plum.vercel.app/api

# Clerk Authentication Publishable Key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_b3JnYW5pYy1tZWVya2F0LTI0LmNsZXJrLmFjY291bnRzLmRldiQ
```

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build production bundle
npm run build

# 4. Preview production build locally
npm run preview
```

---

## ☁️ Vercel Deployment Settings

- **Framework Preset**: `Vite`
- **Root Directory**: `client`
- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **SPA Routing**: Handled via `vercel.json` rewrites (`/(.*)` -> `/index.html`)
