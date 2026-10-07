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
import Chatbot from './components/Chatbot';

import { Toaster } from 'react-hot-toast';
import Footer from './components/Footer';

const App = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      <Toaster position="top-right" />

      {!isAdminRoute && <Navbar />}

      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/movies' element={<Movies />} />
        <Route path='/movies/:id' element={<MovieDetails />} />
        <Route path='/movies/:id/:date' element={<SeatLayout />} />
        <Route path='/movie/:id/:date' element={<SeatLayout />} />
        <Route path='/booking/:id' element={<SeatLayout />} />
        <Route path='/mybookings' element={<MyBookings />} />
        <Route path='/my-bookings' element={<MyBookings />} />
        <Route path='/favourite' element={<Favourite />} />
        <Route path='/theaters' element={<Theaters />} />
        <Route path='/releases' element={<Releases />} />
        <Route path='/admin' element={<AdminDashboard />} />
        <Route path='/admin/*' element={<AdminDashboard />} />
      </Routes>

      {/* Floating AI Cinema Assistant Chatbox */}
      {!isAdminRoute && <Chatbot />}

      {!isAdminRoute && <Footer />}
    </>
  );
};

export default App;
