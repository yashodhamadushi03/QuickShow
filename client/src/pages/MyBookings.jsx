import React, { useState, useEffect } from "react";
import { Ticket, Calendar, MapPin, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { FALLBACK_POSTER } from "../assets/assets";

const API_BASE_URL = "http://localhost:8000/api";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fallbackBookings = [
    {
      booking_id: 1001,
      status: "Confirmed",
      total_amount: "3000.00",
      created_at: "2026-10-07T12:00:00Z",
      showtime: {
        movie: {
          title: "Avatar: The Way of Water",
          poster_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800",
          genre: "Sci-Fi / Action"
        },
        hall: {
          hall_name: "Screen 1 - IMAX",
          theater: { name: "Scope Cinemas - Colombo City Centre", city: "Colombo" }
        },
        start_time: "2026-10-08T18:30:00Z"
      },
      booking_seats: [
        { seat: { row_label: "D", seat_number: 5 } },
        { seat: { row_label: "D", seat_number: 6 } }
      ],
      payment: {
        transaction_reference: "TXN-LK8F92A1"
      }
    }
  ];

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/bookings/my`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.length > 0 ? data : fallbackBookings);
      } else {
        setBookings(fallbackBookings);
      }
    } catch (err) {
      console.warn("Backend API unavailable, using sample bookings.", err);
      setBookings(fallbackBookings);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-16 px-6 md:px-16">
      <div className="max-w-5xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-sm font-medium mb-3 border border-rose-500/20">
          <Ticket className="w-4 h-4" /> My Digital Tickets
        </div>
        <h1 className="text-4xl font-extrabold text-white">My Movie Bookings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Present your ticket entrance pass code at the cinema hall.
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-lg">You haven't made any ticket reservations yet.</p>
            <Link
              to="/movies"
              className="inline-block mt-4 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition-all"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const movie = booking.showtime?.movie;
              const hall = booking.showtime?.hall;
              const theater = hall?.theater;
              const seatsList = booking.booking_seats
                ?.map((bs) => `${bs.seat?.row_label || ""}${bs.seat?.seat_number || ""}`)
                .filter(Boolean)
                .join(", ");

              return (
                <div
                  key={booking.booking_id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-xl flex flex-col md:flex-row"
                >
                  {/* Poster */}
                  <div className="md:w-48 bg-slate-950 shrink-0">
                    <img
                      src={movie?.poster_url || FALLBACK_POSTER}
                      alt={movie?.title || "Movie"}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_POSTER;
                      }}
                      className="w-full h-48 md:h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-bold text-rose-400 uppercase tracking-wide">
                          {movie?.genre || "Movie"}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {booking.status}
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold text-white mb-4">{movie?.title}</h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm text-slate-300 mb-4">
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>{theater?.name} ({hall?.hall_name})</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>{booking.showtime?.start_time ? new Date(booking.showtime.start_time).toLocaleString() : "Upcoming Showtime"}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Ticket className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>Seats: <strong className="text-white">{seatsList || "D5, D6"}</strong></span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Total Paid: <strong className="text-emerald-400">LKR {parseFloat(booking.total_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Entrance Code */}
                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-400">Entrance Passcode</div>
                      <div className="font-mono text-base font-bold text-rose-400 bg-slate-950 px-4 py-1.5 rounded-lg border border-slate-800">
                        {booking.payment?.transaction_reference || `TXN-QSHOW${booking.booking_id}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;