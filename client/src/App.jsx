import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import Home from './pages/Home';
import Navbar from './components/Navbar';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import SeatLayout from './pages/SeatLayout';
import MyBookings from './pages/MyBookings';
import Favourite from './pages/Favourite';

import { Toaster } from 'react-hot-toast';

import Footer from './components/Footer';
import Theaters from './pages/Theaters';
import Releases from './pages/Releases';

const App = () => {

  const location = useLocation();

  const isAdminRoute =
    location.pathname.startsWith('/admin');

  return (
    <>
      <Toaster />

      {!isAdminRoute && <Navbar />}

      <Routes>
        <Route path='/' element={<Home />} />
<Route path='/movies' element={<Movies />} />
<Route path='/movies/:id' element={<MovieDetails />} />
<Route path='/movies/:id/:date' element={<SeatLayout />} />
<Route path='/mybookings' element={<MyBookings />} />
<Route path='/favourite' element={<Favourite />} />
<Route path='/theaters' element={<Theaters />}/>
<Route path='/releases' element={<Releases />}/>
      </Routes>

      {!isAdminRoute && <Footer />}    {/* Conditionally render Footer based on the route */}
    </>
  );
};

export default App;
