import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

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
import CompleteProfilePage from './pages/CompleteProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import Chatbot from './components/Chatbot';

import { Toaster, toast } from 'react-hot-toast';
import Footer from './components/Footer';

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useUser();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute =
    location.pathname.startsWith('/sign-in') ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/sign-up');
  const isOnboardingRoute =
    location.pathname.startsWith('/complete-profile') ||
    location.pathname.startsWith('/onboarding');

  // Automatically synchronize user profile and check onboarding status in MySQL database
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;
    if (!email) return;

    const name =
      user.fullName ||
      `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      user.username ||
      'Customer';
    const phone =
      user.primaryPhoneNumber?.phoneNumber ||
      user.phoneNumbers?.[0]?.phoneNumber ||
      localStorage.getItem("customer_phone") ||
      null;

    const syncKey = `synced_${user.id}_${user.updatedAt ? new Date(user.updatedAt).getTime() : ''}`;
    if (!sessionStorage.getItem(syncKey)) {
      fetch('http://localhost:8000/api/auth/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          phone,
        }),
      })
        .then((res) => {
          if (res.ok) {
            sessionStorage.setItem(syncKey, 'true');
          }
        })
        .catch((err) => console.warn('User profile sync to MySQL:', err));
    }

    // Onboarding Check: Ensure user has completed essential profile details (phone number) in MySQL
    if (isAdminRoute || isAuthRoute || isOnboardingRoute) return;

    const completedKey = `profile_completed_${user.id}`;
    if (sessionStorage.getItem(completedKey) === 'true') return;

    fetch(`http://localhost:8000/api/users/status?email=${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.is_completed) {
            sessionStorage.setItem(completedKey, 'true');
            if (data.phone) {
              localStorage.setItem('customer_phone', data.phone);
            }
          } else if (data.needs_onboarding) {
            // First-time login or incomplete profile -> redirect to sleek profile completion page
            navigate('/complete-profile', {
              replace: true,
              state: { returnUrl: location.pathname },
            });
            toast('Please complete your profile details to continue.', {
              icon: '👋',
              id: 'onboarding-notice',
            });
          }
        }
      })
      .catch((err) => console.debug('Onboarding check error:', err));
  }, [isLoaded, isSignedIn, user?.id, user?.updatedAt, location.pathname, isAdminRoute, isAuthRoute, isOnboardingRoute, navigate]);

  return (
    <>
      <Toaster position="top-right" />

      {!isAdminRoute && !isAuthRoute && !isOnboardingRoute && <Navbar />}


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

        {/* Member Onboarding & Profile Setup Routes */}
        <Route path='/complete-profile' element={<CompleteProfilePage />} />
        <Route path='/onboarding' element={<CompleteProfilePage />} />


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
      {!isAdminRoute && !isAuthRoute && !isOnboardingRoute && <Chatbot />}

      {!isAdminRoute && !isAuthRoute && !isOnboardingRoute && <Footer />}
    </>
  );

};

export default App;
