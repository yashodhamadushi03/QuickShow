import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import Home from './pages/Home';
import Navbar from './components/Navbar';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import SeatLayout from './pages/SeatLayout';
import MyBookings from './pages/MyBookings';
import Favourite from './pages/Favourite';
import Theaters from './pages/Theaters';
import Releases from './pages/Releases';
import AdminDashboard from './pages/AdminDashboard';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import Chatbot from './components/Chatbot';

import { Toaster } from 'react-hot-toast';
import Footer from './components/Footer';

const App = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute =
    location.pathname.startsWith('/sign-in') ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/sign-up');

  return (
    <>
      <Toaster position="top-right" />

      {!isAdminRoute && !isAuthRoute && <Navbar />}

      <Routes>
        {/* Public Browsing Routes */}
        <Route path='/' element={<Home />} />
        <Route path='/movies' element={<Movies />} />
        <Route path='/movies/:id' element={<MovieDetails />} />
        <Route path='/theaters' element={<Theaters />} />
        <Route path='/releases' element={<Releases />} />

        {/* Authentication Routes */}
        <Route path='/sign-in' element={<SignInPage />} />
        <Route path='/login' element={<SignInPage />} />
        <Route path='/sign-up' element={<SignUpPage />} />

        {/* Protected Customer Routes - Seat Booking & Ticket Checkout */}
        <Route
          path='/movies/:id/:date'
          element={
            <ProtectedRoute message="Please sign in to choose your seats and complete your booking.">
              <SeatLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path='/movie/:id/:date'
          element={
            <ProtectedRoute message="Please sign in to choose your seats and complete your booking.">
              <SeatLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path='/booking/:id'
          element={
            <ProtectedRoute message="Please sign in to choose your seats and complete your booking.">
              <SeatLayout />
            </ProtectedRoute>
          }
        />

        {/* Protected Customer Routes - Favourites & Bookings */}
        <Route
          path='/favourite'
          element={
            <ProtectedRoute message="Please sign in to view and manage your favourite movies.">
              <Favourite />
            </ProtectedRoute>
          }
        />
        <Route
          path='/favourites'
          element={
            <ProtectedRoute message="Please sign in to view and manage your favourite movies.">
              <Favourite />
            </ProtectedRoute>
          }
        />
        <Route
          path='/mybookings'
          element={
            <ProtectedRoute message="Please sign in to view your tickets and booking history.">
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path='/my-bookings'
          element={
            <ProtectedRoute message="Please sign in to view your tickets and booking history.">
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path='/admin'
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path='/admin/*'
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
      </Routes>

      {/* Floating AI Cinema Assistant Chatbox */}
      {!isAdminRoute && !isAuthRoute && <Chatbot />}

      {!isAdminRoute && !isAuthRoute && <Footer />}
    </>
  );
};

export default App;
