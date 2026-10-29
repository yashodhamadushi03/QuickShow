import React, { useState, useEffect } from "react";
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  FlaskConical,
  Sparkles,
  ArrowRight,
  Film,
  User
} from "lucide-react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { FALLBACK_POSTER } from "../assets/assets";
import ProfileModal from "../components/ProfileModal";

const API_BASE_URL = "http://localhost:8000/api";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();

  const userEmail = (
    clerkUser?.primaryEmailAddress?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    localStorage.getItem("customer_email") ||
    ""
  ).trim().toLowerCase();

  const fetchMyBookings = async (showLoader = true) => {
    if (!isClerkLoaded) return;

    // Strict Isolation: If no authenticated user email exists, display zero bookings
    if (!userEmail) {
      setBookings([]);
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (showLoader) setLoading(true);
    setIsRefreshing(true);

    try {
      const token = localStorage.getItem("token") || "";
      const queryParam = `?email=${encodeURIComponent(userEmail)}`;

      let data = null;
      // 1. Primary endpoint: GET /api/bookings/my?email=...
      try {
        const res = await fetch(`${API_BASE_URL}/bookings/my${queryParam}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch (e) {
        console.warn("Primary endpoint /bookings/my error:", e);
      }

      // 2. Secondary endpoint: GET /api/user/bookings?email=...
      if (!data) {
        try {
          const res2 = await fetch(`${API_BASE_URL}/user/bookings${queryParam}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res2.ok) {
            data = await res2.json();
          }
        } catch (e2) {
          console.warn("Secondary endpoint /user/bookings error:", e2);
        }
      }

      // Read user-scoped local cache of instant bookings
      let cached = [];
      try {
        const userRecentKey = `quickshow_recent_bookings_${userEmail}`;
        const rawUserRecent = localStorage.getItem(userRecentKey);
        if (rawUserRecent) {
          cached = JSON.parse(rawUserRecent);
        }
        // Strict safety check: ensure cached items strictly belong to current user
        cached = (Array.isArray(cached) ? cached : []).filter(
          (b) => !b.customer_email || b.customer_email.toLowerCase() === userEmail
        );
      } catch (err) {
        cached = [];
      }

      if (Array.isArray(data) && data.length > 0) {
        // Enforce strict filtering on returned records to guarantee no cross-user pollution
        const userSpecificDbData = data.filter(
          (b) => !b.customer_email || b.customer_email.toLowerCase() === userEmail
        );
        const dbIds = new Set(userSpecificDbData.map((b) => b.booking_id));
        const unmerged = cached.filter((b) => !dbIds.has(b.booking_id));
        const merged = [...unmerged, ...userSpecificDbData];
        merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setBookings(merged);
      } else if (cached.length > 0) {
        cached.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setBookings(cached);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.warn("Backend API unavailable, using user-scoped cached bookings:", err);
      try {
        const userRecentKey = `quickshow_recent_bookings_${userEmail}`;
        const cached = JSON.parse(localStorage.getItem(userRecentKey) || "[]").filter(
          (b) => !b.customer_email || b.customer_email.toLowerCase() === userEmail
        );
        setBookings(cached);
      } catch {
        setBookings([]);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyBookings(true);

    const handleUpdate = () => {
      fetchMyBookings(false);
    };

    window.addEventListener("bookingCreated", handleUpdate);
    window.addEventListener("userChanged", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("bookingCreated", handleUpdate);
      window.removeEventListener("userChanged", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [isClerkLoaded, userEmail]);

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 sm:pt-28 pb-20 px-4 sm:px-8 md:px-16">
      {/* Page Header */}
      <div className="max-w-5xl mx-auto mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-xs sm:text-sm font-bold mb-3 border border-rose-500/20">
            <Ticket className="w-4 h-4 text-rose-500" /> My Digital Tickets & Entrance Passes
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            My Movie Bookings
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2">
            Present your verified digital ticket pass code at the cinema multiplex entrance.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowProfileModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
            title="Edit personal profile and contact details"
          >
            <User className="w-4 h-4 text-rose-500" />
            <span>Profile Details</span>
          </button>
          <button
            onClick={() => fetchMyBookings(false)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
            title="Refresh digital tickets"
          >
            <RefreshCw className={`w-4 h-4 text-rose-500 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-28 gap-4">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-medium animate-pulse">
              Retrieving your digital tickets from database...
            </p>
          </div>
        ) : bookings.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 px-6 bg-slate-900/60 rounded-3xl border border-slate-800/80 shadow-2xl max-w-lg mx-auto">
            <div className="w-20 h-20 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Ticket className="w-10 h-10 text-rose-500 stroke-[1.5]" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">No Ticket Reservations Found</h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              You haven't made any cinema ticket reservations yet. Browse our now showing movies and reserve your preferred seats.
            </p>
            <Link
              to="/movies"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-2xl text-base shadow-xl shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Film className="w-5 h-5" /> Browse Now Showing Movies
            </Link>
          </div>
        ) : (
          /* Real-Time Bookings List */
          <div className="space-y-6">
            {bookings.map((booking, idx) => {
              const movie = booking.showtime?.movie;
              const hall = booking.showtime?.hall;
              const theater = hall?.theater;
              const movieTitle = movie?.title || "Cinema Movie";
              const theaterName =
                theater?.name ||
                booking.theater_name ||
                "Scope Cinemas Multiplex - Colombo City Centre";
              const hallName = hall?.hall_name || "Screen 1 - Dolby Atmos";
              const posterUrl = movie?.poster_url || movie?.poster_path || FALLBACK_POSTER;

              // Extract seat labels
              let seatsList = "";
              if (Array.isArray(booking.booking_seats) && booking.booking_seats.length > 0) {
                seatsList = booking.booking_seats
                  .map((bs) => {
                    if (bs.seat?.row_label && bs.seat?.seat_number) {
                      return `${bs.seat.row_label}${bs.seat.seat_number}`;
                    }
                    if (bs.seat_id) return `Seat #${bs.seat_id}`;
                    return "";
                  })
                  .filter(Boolean)
                  .join(", ");
              }
              if (!seatsList && Array.isArray(booking.seats)) {
                seatsList = booking.seats.join(", ");
              }
              if (!seatsList) seatsList = "Confirmed Seats";

              const refCode =
                booking.payment?.transaction_reference ||
                booking.transaction_reference ||
                booking.passcode ||
                `TXN-QSHOW${booking.booking_id}`;

              const isSandbox =
                booking.payment?.is_sandbox ||
                booking.is_sandbox ||
                refCode.includes("SANDBOX");

              const rawAmount = parseFloat(booking.total_amount || 0);

              const formattedDate = booking.showtime?.start_time
                ? new Date(booking.showtime.start_time).toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Upcoming Screening";

              return (
                <div
                  key={booking.booking_id || idx}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row transition-all duration-300"
                >
                  {/* Poster Thumbnail */}
                  <div className="md:w-56 bg-slate-950 shrink-0 relative overflow-hidden">
                    <img
                      src={posterUrl}
                      alt={movieTitle}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_POSTER;
                      }}
                      className="w-full h-56 md:h-full object-cover object-center"
                    />
                    {isSandbox && (
                      <div className="absolute top-3 left-3 bg-amber-500/90 text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-md flex items-center gap-1 shadow-lg">
                        <FlaskConical className="w-3 h-3" /> Sandbox Demo
                      </div>
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Status Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <span className="text-xs sm:text-sm font-extrabold text-rose-400 uppercase tracking-wider">
                          {movie?.genre || movie?.genres?.[0]?.name || "Blockbuster Cinema"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> {booking.status || "Confirmed"}
                          </span>
                        </div>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 tracking-tight">
                        {movieTitle}
                      </h2>

                      {/* Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm sm:text-base text-slate-200 mb-5">
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-5 h-5 text-rose-500 shrink-0" />
                          <span>
                            <strong className="text-white font-bold">{theaterName}</strong>
                            <span className="text-slate-400 block text-xs">{hallName}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Calendar className="w-5 h-5 text-rose-500 shrink-0" />
                          <span>
                            <strong className="text-white font-bold">{formattedDate}</strong>
                            <span className="text-slate-400 block text-xs">Standard Sri Lanka Time</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Ticket className="w-5 h-5 text-rose-500 shrink-0" />
                          <span>
                            Seats: <strong className="text-white font-extrabold">{seatsList}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                          <span>
                            Total Paid:{" "}
                            <strong className="text-emerald-400 font-extrabold">
                              LKR{" "}
                              {rawAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Entrance Code Pass & Footer */}
                    <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                          Multiplex Entrance Passcode
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Show this code at the ticket gate for entry
                        </div>
                      </div>

                      <div className="font-mono text-base sm:text-lg font-black text-rose-400 bg-slate-950 px-5 py-2.5 rounded-xl border border-slate-800 tracking-wider shadow-inner">
                        {refCode}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Profile Details Modal */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
};

export default MyBookings;