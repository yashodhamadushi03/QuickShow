import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  TrendingUp,
  Ticket,
  Users,
  Film,
  MapPin,
  Clock,
  Activity,
  DollarSign,
  AlertCircle,
  BarChart3,
  Lock,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Coffee
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:8000/api";

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState(localStorage.getItem("admin_token") || "");
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("admin@quickshow.lk");
  const [loginPassword, setLoginPassword] = useState("admin123");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active tab state: 'analytics' | 'bookings' | 'customers' | 'occupancy' | 'fnb'
  const [activeTab, setActiveTab] = useState("analytics");

  // Dashboard Data State
  const [analytics, setAnalytics] = useState(null);
  const [liveBookings, setLiveBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (adminToken) {
      setIsAuthenticated(true);
      fetchDashboardData(adminToken);
    }
  }, [adminToken]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Invalid admin credentials");
      }

      const data = await res.json();
      localStorage.setItem("admin_token", data.access_token);
      setAdminToken(data.access_token);
      setIsAuthenticated(true);
      toast.success("Welcome back, Cinema Administrator!", { icon: "🛡️" });
      fetchDashboardData(data.access_token);
    } catch (err) {
      toast.error(err.message || "Admin login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setAdminToken("");
    setIsAuthenticated(false);
    toast("Logged out of Admin Portal", { icon: "🔒" });
  };

  const fetchDashboardData = async (token) => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [analyticsRes, bookingsRes, customersRes, activitiesRes, occupancyRes, waitlistRes] =
        await Promise.all([
          fetch(`${API_BASE_URL}/admin/analytics`, { headers }),
          fetch(`${API_BASE_URL}/admin/live-bookings`, { headers }),
          fetch(`${API_BASE_URL}/admin/customers`, { headers }),
          fetch(`${API_BASE_URL}/admin/activities`, { headers }),
          fetch(`${API_BASE_URL}/admin/occupancy-heatmap`, { headers }),
          fetch(`${API_BASE_URL}/admin/waitlist-monitor`, { headers }),
        ]);

      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (bookingsRes.ok) setLiveBookings(await bookingsRes.json());
      if (customersRes.ok) setCustomers(await customersRes.json());
      if (activitiesRes.ok) setActivities(await activitiesRes.json());
      if (occupancyRes.ok) setOccupancy(await occupancyRes.json());
      if (waitlistRes.ok) setWaitlist(await waitlistRes.json());
    } catch (err) {
      console.warn("Using sample admin analytics preview.", err);
    } finally {
      setLoading(false);
    }
  };

  // Sample Fallbacks if backend server returns empty
  const displayAnalytics = analytics || {
    total_revenue_lkr: 485000.0,
    total_tickets_sold: 284,
    average_fill_rate_percent: 86.4,
    active_showtimes_count: 18,
    revenue_by_branch: [
      { branch: "Scope Cinemas - Colombo City Centre", revenue_lkr: 185000.0, occupancy_percent: 92.0 },
      { branch: "Scope Cinemas - Havelock City Mall (IMAX)", revenue_lkr: 142000.0, occupancy_percent: 88.5 },
      { branch: "Savoy 3D Dolby Atmos - Wellawatte", revenue_lkr: 78000.0, occupancy_percent: 79.0 },
      { branch: "PVR Cinemas - One Galle Face", revenue_lkr: 95000.0, occupancy_percent: 85.0 },
      { branch: "Regal Cinema - Cargills Square Jaffna", revenue_lkr: 45000.0, occupancy_percent: 74.0 }
    ],
    booking_status_counts: { confirmed: 240, pending: 18, cancelled: 6 }
  };

  const displayBookings = liveBookings.length > 0 ? liveBookings : [
    {
      booking_id: 1001,
      customer_name: "Kasun Perera",
      customer_email: "kasun@quickshow.lk",
      movie_title: "Avatar: The Way of Water",
      theater_name: "Scope Cinemas - Colombo City Centre",
      hall_name: "Screen 1 - Dolby Atmos",
      seats: ["D5", "D6"],
      total_lkr: 3000.0,
      status: "confirmed",
      passcode: "TXN-LK8F92A1",
      created_at: "2026-10-08 14:30:00"
    },
    {
      booking_id: 1002,
      customer_name: "Nipuni Silva",
      customer_email: "nipuni@quickshow.lk",
      movie_title: "Kandak Sema",
      theater_name: "Savoy 3D Dolby Atmos - Wellawatte",
      hall_name: "Savoy Screen 1",
      seats: ["F8", "F9"],
      total_lkr: 3000.0,
      status: "confirmed",
      passcode: "TXN-LK3C14B8",
      created_at: "2026-10-08 15:10:00"
    },
    {
      booking_id: 1003,
      customer_name: "Santhush Wickrama",
      customer_email: "santhush@quickshow.lk",
      movie_title: "GOAT (Tamil 4K)",
      theater_name: "Scope Cinemas - Havelock City Mall (IMAX)",
      hall_name: "Screen 1 - IMAX",
      seats: ["G11", "G12"],
      total_lkr: 4600.0,
      status: "confirmed",
      passcode: "TXN-LK99A102",
      created_at: "2026-10-08 16:05:00"
    }
  ];

  const displayActivities = activities.length > 0 ? activities : [
    {
      activity_id: "ACT-1001",
      type: "TICKET_RESERVATION",
      user_name: "Kasun Perera",
      details: "Reserved seats D5, D6 for 'Avatar' at Scope Cinemas CCC",
      timestamp: "10 mins ago",
      amount_lkr: 3000.0
    },
    {
      activity_id: "ACT-1002",
      type: "FNB_PREORDER",
      user_name: "Nimmi Fernando",
      details: "Pre-ordered Jumbo Popcorn + 2 Drinks for Savoy 3D",
      timestamp: "25 mins ago",
      amount_lkr: 2200.0
    },
    {
      activity_id: "ACT-1003",
      type: "AI_SEAT_OPTIMIZER",
      user_name: "Sahan Gunawardena",
      details: "Triggered AI Smart Seat Optimizer for Havelock IMAX",
      timestamp: "40 mins ago",
      amount_lkr: 0.0
    }
  ];

  // If not authenticated, render Admin Login Security Shield Modal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold text-white text-center mb-1">Admin Security Portal</h2>
          <p className="text-slate-400 text-xs text-center mb-6">
            Sign in with Cinema Administrator credentials to access live monitoring and analytics.
          </p>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Admin Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@quickshow.lk"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" /> Access Admin Portal
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 font-mono">
              Default Admin: <strong>admin@quickshow.lk</strong> / <strong>admin123</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-16 px-4 sm:px-8 lg:px-12">
      {/* Admin Top Banner */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold mb-2 border border-rose-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Cinema Operations & RBAC Control
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Customer Activity & Real-Time Analytics Dashboard
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Live revenue feeds, hall occupancy fill rates, and customer reservation logs across Sri Lanka branches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboardData(adminToken)}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
            title="Refresh Real-time Feeds"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-500" : ""}`} />
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            LKR {displayAnalytics.total_revenue_lkr?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Islandwide ticket & F&B sales</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tickets Sold</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {displayAnalytics.total_tickets_sold} <span className="text-xs font-normal text-slate-400">Seats</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">Confirmed reservations</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hall Fill Rate</span>
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-400">
            {displayAnalytics.average_fill_rate_percent}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Peak evening showtime average</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Showtimes</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Film className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">
            {displayAnalytics.active_showtimes_count} <span className="text-xs font-normal text-slate-400">Slots</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">10 Sri Lankan branches</div>
        </div>
      </div>

      {/* Control Navigation Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "analytics"
              ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Revenue & Branch Heatmaps
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "bookings"
              ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Ticket className="w-4 h-4" /> Live Customer Bookings ({displayBookings.length})
        </button>
        <button
          onClick={() => setActiveTab("customers")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "customers"
              ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" /> Customer Profiles & Activity Logs
        </button>
        <button
          onClick={() => setActiveTab("occupancy")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "occupancy"
              ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4" /> Occupancy & Waitlist Monitor
        </button>
      </div>

      {/* TAB CONTENT BODY */}
      <div className="max-w-7xl mx-auto">
        {/* TAB 1: ANALYTICS & BRANCH HEATMAPS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-500" /> Revenue & Occupancy by Sri Lanka Multiplex Branch
              </h3>

              <div className="space-y-4">
                {displayAnalytics.revenue_by_branch.map((branch, i) => (
                  <div key={i} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <span className="font-semibold text-sm text-white">{branch.branch}</span>
                      <span className="font-extrabold text-emerald-400 text-sm">
                        LKR {branch.revenue_lkr.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-rose-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${branch.occupancy_percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 font-mono">
                      <span>Occupancy Fill Rate: {branch.occupancy_percent}%</span>
                      <span>Target Capacity Met</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE CUSTOMER BOOKINGS */}
        {activeTab === "bookings" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-x-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-rose-500" /> Live Customer Reservations Feed
              </h3>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by customer, movie or passcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Ref / Passcode</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Movie</th>
                  <th className="py-3 px-4">Theater & Hall</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-4">Amount (LKR)</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayBookings
                  .filter((b) =>
                    b.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    b.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    b.movie_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    b.passcode?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((booking, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-rose-400">{booking.passcode}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{booking.customer_name}</div>
                        <div className="text-[10px] text-slate-500">{booking.customer_email}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-200">{booking.movie_title}</td>
                      <td className="py-3 px-4 text-slate-300">
                        {booking.theater_name}
                        <div className="text-[10px] text-slate-500">{booking.hall_name}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-300">
                        {Array.isArray(booking.seats) ? booking.seats.join(", ") : booking.seats}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        LKR {booking.total_lkr?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Confirmed
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: CUSTOMER PROFILES & ACTIVITY LOGS */}
        {activeTab === "customers" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Profiles */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-500" /> Customer Profiles & Total LKR Spend
              </h3>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {(customers.length > 0 ? customers : [
                  { user_id: 1, name: "Kasun Perera", email: "user@quickshow.lk", phone: "+94 77 123 4567", role: "customer", total_bookings: 3, total_spent_lkr: 9000.0 },
                  { user_id: 2, name: "Nimmi Fernando", email: "nimmi@quickshow.lk", phone: "+94 71 987 6543", role: "customer", total_bookings: 2, total_spent_lkr: 6000.0 },
                  { user_id: 3, name: "Scope Admin", email: "admin@quickshow.lk", phone: "+94 11 208 3000", role: "admin", total_bookings: 5, total_spent_lkr: 15000.0 }
                ]).map((c) => (
                  <div key={c.user_id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.email}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">{c.phone} &bull; Role: {c.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-extrabold text-emerald-400 text-sm">
                        LKR {c.total_spent_lkr?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-400">{c.total_bookings} Bookings</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Activity Logs */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-500" /> Customer Engagement Activity Logs
              </h3>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {displayActivities.map((act, i) => (
                  <div key={i} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 flex items-start gap-3">
                    <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl mt-0.5">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-white">{act.user_name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{act.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{act.details}</p>
                      {act.amount_lkr > 0 && (
                        <span className="text-[11px] font-mono font-bold text-emerald-400 mt-1 inline-block">
                          + LKR {act.amount_lkr?.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: OCCUPANCY & WAITLIST MONITOR */}
        {activeTab === "occupancy" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-500" /> Real-Time Hall Seat Fill Rates
              </h3>

              <div className="space-y-4">
                {(occupancy.length > 0 ? occupancy : [
                  { hall_name: "Screen 1 - Dolby Atmos", theater: "Scope Cinemas CCC", capacity: 96, booked_seats: 84, fill_rate_percent: 87.5 },
                  { hall_name: "Screen 1 - IMAX 3D Laser", theater: "Scope Cinemas Havelock City", capacity: 120, booked_seats: 112, fill_rate_percent: 93.3 },
                  { hall_name: "Savoy 3D Main Screen", theater: "Savoy Dolby Atmos Wellawatte", capacity: 180, booked_seats: 140, fill_rate_percent: 77.7 }
                ]).map((h, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-white">{h.hall_name}</span>
                      <span className="font-mono text-rose-400 font-bold">{h.fill_rate_percent}% Filled</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mb-2">{h.theater}</div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-600 h-full rounded-full" style={{ width: `${h.fill_rate_percent}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" /> Sold-Out Showtime Waitlists
              </h3>

              <div className="space-y-4">
                {(waitlist.length > 0 ? waitlist : [
                  { movie_title: "Dune: Part Two (IMAX)", theater: "Scope Cinemas - Havelock City Mall", showtime: "7:30 PM Tonight", waitlist_users_count: 8, status: "FULL_OCCUPANCY" },
                  { movie_title: "GOAT (Tamil 4K)", theater: "Savoy 3D Dolby Atmos - Wellawatte", showtime: "6:30 PM Tonight", waitlist_users_count: 5, status: "FULL_OCCUPANCY" }
                ]).map((w, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{w.movie_title}</div>
                      <div className="text-[11px] text-slate-400">{w.theater}</div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">{w.showtime}</div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold inline-block mb-1">
                        {w.waitlist_users_count} Waiting
                      </span>
                      <div className="text-[10px] text-emerald-400 font-mono">Auto Re-allocation Active</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
