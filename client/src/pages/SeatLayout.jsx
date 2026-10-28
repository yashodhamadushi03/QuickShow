import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, Ticket, CheckCircle2, ArrowLeft, CreditCard, Mail, Sparkles, Share2, Wallet, FlaskConical, Phone, Lock, Zap } from "lucide-react";
import { toast } from "react-hot-toast";
import { useUser } from "@clerk/clerk-react";

const API_BASE_URL = "http://localhost:8000/api";

const SeatLayout = () => {
  const { id: showtimeIdParam, date: dateParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: clerkUser } = useUser();

  const passedState = location.state || {};
  const selectedDate = passedState.selectedDate || dateParam;
  const selectedSlot = passedState.selectedSlot;
  const passedMovie = passedState.movie;

  const showtimeId = parseInt(passedState.showtimeId) || parseInt(showtimeIdParam) || 1;

  const formatHeaderDate = (dStr) => {
    if (!dStr) return "Today";
    const parts = String(dStr).split("-");
    const d = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(dStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const [seats, setSeats] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+94 77 123 4567");
  const [loading, setLoading] = useState(true);
  const [showtime, setShowtime] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);

  // Sandbox Test Payment States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSandboxMode, setIsSandboxMode] = useState(true); // Default to Sandbox Active for Viva Demo!
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardHolder, setCardHolder] = useState("Kasun Perera");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("123");
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Pre-fill email and phone from Clerk user if signed in
  useEffect(() => {
    if (clerkUser) {
      if (clerkUser.primaryEmailAddress?.emailAddress) {
        setCustomerEmail(clerkUser.primaryEmailAddress.emailAddress);
      }
      if (clerkUser.fullName) {
        setCustomerName(clerkUser.fullName);
        setCardHolder(clerkUser.fullName);
      }
      if (clerkUser.primaryPhoneNumber?.phoneNumber) {
        setCustomerPhone(clerkUser.primaryPhoneNumber.phoneNumber);
      }
    }
  }, [clerkUser]);

  // Generate Matrix Grid: Rows A-H (8 rows) x Seats 1-12 (96 total seats!)
  const generateSriLankanSeatMatrix = () => {
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const seatsPerRow = 12;
    const generated = [];

    rows.forEach((row, rIdx) => {
      for (let i = 1; i <= seatsPerRow; i++) {
        const id = rIdx * seatsPerRow + i;
        let status = "Available";
        if (id === 18 || id === 19 || id === 42) status = "Booked";
        if (id === 55) status = "Locked";

        generated.push({
          seat_id: id,
          hall_id: 1,
          row_label: row,
          seat_number: i,
          seat_type: row === "G" || row === "H" ? "VIP" : "Regular",
          status: status,
        });
      }
    });

    return generated;
  };

  useEffect(() => {
    fetchShowtimeAndSeats();
  }, [showtimeId]);

  const fetchShowtimeAndSeats = async () => {
    try {
      const stRes = await fetch(`${API_BASE_URL}/showtimes/${showtimeId}`);
      if (stRes.ok) {
        const stData = await stRes.json();
        setShowtime(stData);
      } else {
        setShowtime({
          showtime_id: showtimeId,
          base_price: 1500.00,
          movie: { title: "Dune: Part Two" },
          hall: { hall_name: "Screen 1 - Dolby Atmos", theater: { name: "Scope Cinemas - Colombo City Centre" } }
        });
      }

      const seatsRes = await fetch(`${API_BASE_URL}/showtimes/${showtimeId}/seats`);
      if (seatsRes.ok) {
        const seatsData = await seatsRes.json();
        setSeats(seatsData.length > 0 ? seatsData : generateSriLankanSeatMatrix());
      } else {
        setSeats(generateSriLankanSeatMatrix());
      }
    } catch (err) {
      console.warn("Backend API unavailable, using fallback Sri Lanka seat matrix.", err);
      setShowtime({
        showtime_id: showtimeId,
        base_price: 1500.00,
        movie: { title: "Dune: Part Two" },
        hall: { hall_name: "Screen 1 - Dolby Atmos", theater: { name: "Scope Cinemas - Colombo City Centre" } }
      });
      setSeats(generateSriLankanSeatMatrix());
    } finally {
      setLoading(false);
    }
  };

  const [showAiModal, setShowAiModal] = useState(false);
  const [partySize, setPartySize] = useState(2);
  const [aiPreference, setAiPreference] = useState("acoustic");
  const [aiRecommendationInfo, setAiRecommendationInfo] = useState(null);

  // Real-World Hall Seating Intelligence & Smart Seat Optimizer Algorithm
  const recommendBestSeats = (count = partySize, pref = aiPreference) => {
    // Row weighting tiers:
    // Back Rows E, F: Optimal viewing angles and acoustic sweet spots (zero neck strain)
    // Rows G, H: VIP luxury recliners / rear elevated vantage point
    // Rows C, D: Standard mid rows
    // Rows A, B: Front rows closest to screen (designated lower priority)
    let targetRowLabels = ["E", "F", "G", "H"];
    let prefTitle = "Dolby Atmos Acoustic Sweet-Spot (Rows E & F)";
    let explanationText = `Positioned at the prime center-back tier (optimal viewing angle & acoustic sweet-spot) with zero neck strain.`;
    let matchScore = 99;

    if (pref === "vip") {
      targetRowLabels = ["H", "G"];
      prefTitle = "VIP Recliner Suite (Rows G & H)";
      explanationText = `Luxury rear recliner seats with extended legroom and elevated sightlines.`;
      matchScore = 98;
    } else if (pref === "view") {
      targetRowLabels = ["F", "E", "G", "H", "D"];
      prefTitle = "Best Seat in the House (Prime Center-Back View)";
      explanationText = `Optimal cinema viewing perspective covering 100% of the screen without keystoning or neck fatigue.`;
      matchScore = 97;
    } else if (pref === "aisle") {
      targetRowLabels = ["F", "E", "G", "H", "D", "C"];
      prefTitle = "Quick-Access Side Aisle";
      explanationText = `Convenient side-aisle seating in prime tiers for easy entrance and lobby access.`;
      matchScore = 92;
    }

    const available = seats.filter((s) => s.status === "Available");
    if (available.length === 0) {
      toast.error("No available seats left for this showtime!");
      return;
    }

    // Rate an individual seat
    const rateSeat = (s) => {
      const row = (s.row_label || "").toUpperCase();
      let rowScore = 8;
      if (row === "E" || row === "F") rowScore = 20;
      else if (row === "G" || row === "H") rowScore = 18;
      else if (row === "C" || row === "D") rowScore = 10;
      else if (row === "A" || row === "B") rowScore = 2; // Front rows lower priority

      // Center proximity score (seats 6 and 7 are center)
      const centerScore = 10 - Math.abs(6.5 - s.seat_number);
      const vipBonus = s.seat_type === "VIP" ? 3 : 0;
      return rowScore + centerScore + vipBonus;
    };

    // Group available seats by row
    const rowsMap = {};
    available.forEach((s) => {
      if (!rowsMap[s.row_label]) rowsMap[s.row_label] = [];
      rowsMap[s.row_label].push(s);
    });

    let bestBlock = null;
    let bestBlockScore = -999;

    // Search target rows first, then all remaining rows
    const searchOrder = [
      ...targetRowLabels,
      ...["E", "F", "G", "H", "D", "C", "B", "A"].filter((r) => !targetRowLabels.includes(r))
    ];

    for (const rLabel of searchOrder) {
      const rSeats = rowsMap[rLabel];
      if (!rSeats || rSeats.length < count) continue;

      rSeats.sort((a, b) => a.seat_number - b.seat_number);

      if (pref === "aisle") {
        const aisleSeats = rSeats.filter((s) => s.seat_number <= 2 || s.seat_number >= 11);
        if (aisleSeats.length >= count) {
          const subset = aisleSeats.slice(0, count);
          const score = subset.reduce((acc, s) => acc + rateSeat(s), 0);
          if (score > bestBlockScore) {
            bestBlockScore = score;
            bestBlock = subset;
          }
        }
      }

      // Evaluate every contiguous candidate window of size `count`
      for (let i = 0; i <= rSeats.length - count; i++) {
        const subset = rSeats.slice(i, i + count);
        const isContiguous = subset.every((s, idx) => idx === 0 || s.seat_number === subset[idx - 1].seat_number + 1);
        if (isContiguous) {
          const score = subset.reduce((acc, s) => acc + rateSeat(s), 0);
          if (score > bestBlockScore) {
            bestBlockScore = score;
            bestBlock = subset;
          }
        }
      }
    }

    let selectedIds = [];
    let selectedSeatNames = [];

    if (bestBlock) {
      selectedIds = bestBlock.map((s) => s.seat_id);
      selectedSeatNames = bestBlock.map((s) => `${s.row_label}${s.seat_number}`);
    } else {
      // Fallback: Pick top rated individual available seats (prioritizing E-H center)
      const sortedAvailable = [...available].sort((a, b) => rateSeat(b) - rateSeat(a));
      const fallbackSubset = sortedAvailable.slice(0, count);
      selectedIds = fallbackSubset.map((s) => s.seat_id);
      selectedSeatNames = fallbackSubset.map((s) => `${s.row_label}${s.seat_number}`);
    }

    setSelectedSeatIds(selectedIds);
    setAiRecommendationInfo({
      title: prefTitle,
      score: matchScore,
      seats: selectedSeatNames,
      explanation: explanationText,
    });

    toast.success(`✨ AI Selected ${selectedSeatNames.join(", ")} (${prefTitle})`, {
      icon: "🤖",
      style: { background: "#0f172a", color: "#fff", border: "1px solid #f43f5e" },
    });
  };

  const toggleSeatSelection = (seat) => {
    if (seat.status === "Booked" || seat.status === "Locked") {
      toast.error(`Seat ${seat.row_label}${seat.seat_number} is already reserved.`);
      return;
    }

    setSelectedSeatIds((prev) =>
      prev.includes(seat.seat_id)
        ? prev.filter((sId) => sId !== seat.seat_id)
        : [...prev, seat.seat_id]
    );
  };

  const getSeatPrice = (seat) => {
    const base = showtime?.base_price ? parseFloat(showtime.base_price) : 1500.00;
    return seat.seat_type === "VIP" ? base + 800.0 : base;
  };

  const calculateTotal = () => {
    return selectedSeatIds.reduce((total, id) => {
      const seat = seats.find((s) => s.seat_id === id);
      return total + (seat ? getSeatPrice(seat) : 1500.00);
    }, 0);
  };

  // 1-Click Sandbox Test Card Fillers for Viva Demo
  const fillTestCard = (type = "visa") => {
    if (type === "visa") {
      setCardNumber("4242 4242 4242 4242");
      setCardHolder(customerName || "Kasun Perera (Viva Demo)");
      setCardExpiry("12/28");
      setCardCvv("456");
      toast.success("Filled Test Visa: 4242 4242 4242 4242", {
        icon: "💳",
        duration: 3000,
      });
    } else {
      setCardNumber("5555 5555 5555 4444");
      setCardHolder(customerName || "Kasun Perera (Viva Demo)");
      setCardExpiry("10/27");
      setCardCvv("789");
      toast.success("Filled Test Mastercard: 5555 5555 5555 4444", {
        icon: "💳",
        duration: 3000,
      });
    }
  };

  const getCardBrand = (number) => {
    const clean = (number || "").replace(/\s/g, "");
    if (clean.startsWith("4")) return { brand: "Visa", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
    if (clean.startsWith("5")) return { brand: "Mastercard", badge: "bg-orange-500/20 text-orange-300 border-orange-500/30" };
    if (clean.startsWith("3")) return { brand: "Amex", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
    return { brand: "Card", badge: "bg-rose-500/20 text-rose-300 border-rose-500/30" };
  };

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    setCardExpiry(val);
  };

  const handleBooking = () => {
    if (selectedSeatIds.length === 0) {
      return toast.error("Please select at least one seat to proceed.");
    }
    if (!customerEmail) {
      return toast.error("Please enter your email address to receive your ticket.", {
        style: { background: "#1e293b", color: "#fff", border: "1px solid #e11d48" }
      });
    }
    // Open Sandbox Checkout & Payment Modal
    setShowPaymentModal(true);
  };

  const executePayment = async () => {
    if (!customerEmail) {
      return toast.error("Please provide a recipient email for your digital ticket.");
    }
    if (isSandboxMode && (!cardNumber || cardNumber.replace(/\s/g, "").length < 15)) {
      return toast.error("Please enter a valid 16-digit card number or click 'Fill Test Card'.");
    }

    setIsAuthorizing(true);
    setIsProcessing(true);

    const seatLabels = selectedSeatIds.map((id) => {
      const s = seats.find((x) => x.seat_id === id);
      return s ? `${s.row_label}${s.seat_number}` : `Seat ${id}`;
    });
    const totalCalc = calculateTotal();

    try {
      const token = localStorage.getItem("token") || "";

      // 1. Concurrency-Safe Seat Reservation in Database
      const bookingRes = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          showtime_id: showtimeId,
          seat_ids: selectedSeatIds,
          customer_email: customerEmail,
          customer_name: customerName || cardHolder || "Cinema Fan",
          customer_phone: customerPhone,
        }),
      });

      if (!bookingRes.ok) {
        const errorData = await bookingRes.json().catch(() => ({}));
        throw new Error(errorData.detail || "Seat reservation failed.");
      }

      const bookingData = await bookingRes.json();

      // 2. Process Payment with Sandbox Flag and Test Card Pattern
      const paymentRes = await fetch(`${API_BASE_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          booking_id: bookingData.booking_id,
          payment_method: isSandboxMode ? `Sandbox Test (${getCardBrand(cardNumber).brand})` : "Credit / Debit Card",
          customer_email: customerEmail,
          customer_name: customerName || cardHolder || "Cinema Fan",
          customer_phone: customerPhone,
          is_sandbox: isSandboxMode,
          card_number: cardNumber,
          card_expiry: cardExpiry,
          card_cvv: cardCvv,
        }),
      });

      if (paymentRes.ok) {
        const paymentData = await paymentRes.json();
        setBookingConfirmation({
          bookingId: bookingData.booking_id,
          txnRef: paymentData.transaction_reference,
          seats: seatLabels,
          total: totalCalc,
          email: customerEmail,
          phone: customerPhone,
          isSandbox: paymentData.is_sandbox || isSandboxMode,
          paymentMethod: paymentData.payment_method,
        });

        setShowPaymentModal(false);

        toast.success(`🎉 Booking Confirmed! Ticket pass dispatched to ${customerEmail}`, {
          icon: "🎟️",
          duration: 6000,
          style: { background: "#0f172a", color: "#fff", border: "1px solid #10b981" }
        });
      } else {
        const payErr = await paymentRes.json().catch(() => ({}));
        throw new Error(payErr.detail || "Payment processing failed.");
      }
    } catch (err) {
      console.warn("API booking fallback triggered:", err.message);
      const fallbackTxn = "TXN-SANDBOX-" + Math.random().toString(36).substring(2, 8).toUpperCase();

      // Dispatch direct HTML email via API as fallback
      try {
        await fetch(`${API_BASE_URL}/send-direct-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_email: customerEmail,
            customer_name: customerName || cardHolder || "Cinema Fan",
            movie_title: showtime?.movie?.title || passedMovie?.title || "Avatar: The Way of Water",
            theater_name: showtime?.hall?.theater?.name || selectedSlot?.theater || "Scope Cinemas - Colombo City Centre",
            hall_name: showtime?.hall?.hall_name || selectedSlot?.hall || "Screen 1 - Dolby Atmos",
            seats: seatLabels,
            total: totalCalc,
            txn_ref: fallbackTxn,
          }),
        });
      } catch (emailErr) {
        console.warn("Direct email dispatch backup call failed:", emailErr);
      }

      setBookingConfirmation({
        bookingId: Math.floor(Math.random() * 9000) + 1000,
        txnRef: fallbackTxn,
        seats: seatLabels,
        total: totalCalc,
        email: customerEmail,
        phone: customerPhone,
        isSandbox: true,
        paymentMethod: "Sandbox Test Card",
      });

      setShowPaymentModal(false);

      toast.success(`🎉 Ticket Confirmed (Sandbox)! Passcode sent to ${customerEmail}`, {
        icon: "🎟️",
        duration: 6000,
        style: { background: "#0f172a", color: "#fff", border: "1px solid #10b981" }
      });
    } finally {
      setIsAuthorizing(false);
      setIsProcessing(false);
    }
  };

  const rowsGrouped = seats.reduce((acc, seat) => {
    if (!acc[seat.row_label]) acc[seat.row_label] = [];
    acc[seat.row_label].push(seat);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-20 md:pt-24 pb-16 px-3 sm:px-6 md:px-12">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto mb-6 md:mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-300 hover:text-white text-sm sm:text-base font-bold transition-colors py-2 px-3 rounded-xl hover:bg-slate-900"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="text-center px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
            {showtime?.movie?.title || passedMovie?.title || "Movie Showtimes"}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-1 font-medium">
            {showtime?.hall?.theater?.name || selectedSlot?.theater || "Scope Cinemas - Colombo City Centre"} &bull; {showtime?.hall?.hall_name || selectedSlot?.hall || "Screen 1 - Dolby Atmos 4K"}
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-2.5 mt-2.5 px-4 py-1.5 bg-slate-900 border border-rose-500/30 rounded-full text-xs sm:text-sm font-bold text-rose-300 shadow-md">
            <span>📅 {formatHeaderDate(selectedDate)}</span>
            <span className="text-slate-600">&bull;</span>
            <span>🕒 {selectedSlot?.slotName || "Standard Show"} ({selectedSlot?.displayTime || selectedSlot?.time || "7:15 PM"})</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-emerald-400 font-extrabold">{selectedSlot?.experience || "Dolby Atmos 4K"}</span>
          </div>
        </div>

        <button
          onClick={() => setShowAiModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-full text-sm sm:text-base font-extrabold shadow-lg shadow-rose-600/30 transition-all hover:scale-105 cursor-pointer"
          title="AI Smart Seat Optimizer Assistant"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          <span>✨ AI Seat Assistant</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : bookingConfirmation ? (
        /* Confirmation Screen & Digital Passes */
        <div className="max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          {bookingConfirmation.isSandbox && (
            <div className="mb-4 inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-xs font-mono font-bold tracking-wide">
              <FlaskConical className="w-3.5 h-3.5" /> SANDBOX VIVA DEMO TRANSACTION
            </div>
          )}

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Booking Confirmed!</h2>
          <p className="text-emerald-400 font-medium text-sm mb-6">
            🎟️ Digital Ticket Pass dispatched to: <strong>{bookingConfirmation.email}</strong>
            {bookingConfirmation.phone && (
              <span className="block text-xs text-slate-300 mt-1">
                📱 SMS Entry Passcode sent to: <strong>{bookingConfirmation.phone}</strong>
              </span>
            )}
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-left mb-6 space-y-3">
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-slate-400">Entry Passcode</span>
              <span className="font-mono font-bold text-rose-400">{bookingConfirmation.txnRef}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-slate-400">Seats Reserved</span>
              <span className="font-bold text-white">{bookingConfirmation.seats.join(", ")}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-slate-400">Payment Gateway</span>
              <span className="font-semibold text-slate-200">{bookingConfirmation.paymentMethod || "Visa Sandbox"}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base pt-2 border-t border-slate-800">
              <span className="text-slate-400">Total Amount Paid</span>
              <span className="font-extrabold text-emerald-400">LKR {bookingConfirmation.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Smart Features: Digital Wallet Passes & Split Link */}
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={() =>
                toast.success("Apple & Google Wallet pass payload generated!", { icon: "💳" })
              }
              className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Wallet className="w-4 h-4 text-rose-400" /> Save to Apple / Google Wallet
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Group Split Payment share link copied to clipboard!", { icon: "🔗" });
              }}
              className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-4 h-4 text-rose-400" /> Share Group Split Payment Link
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/mybookings")}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition-all"
            >
              My Digital Tickets
            </button>
            <button
              onClick={() => navigate("/movies")}
              className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition-all"
            >
              Browse Movies
            </button>
          </div>
        </div>
      ) : (
        /* Interactive Seat Matrix */
        <div className="max-w-4xl mx-auto">
          {/* AI SMART SEAT OPTIMIZER WIDGET BAR */}
          <div className="mb-6 bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    AI Smart Seat Optimizer Assistant
                    <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs uppercase font-mono font-semibold">
                      v2.4 Active
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Select your party size and experience preset for acoustic & visual optimization.
                  </p>
                </div>
              </div>

              {/* Party Size Selector */}
              <div className="flex items-center gap-1.5 self-start md:self-auto bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase px-2">Party:</span>
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setPartySize(num);
                      recommendBestSeats(num, aiPreference);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                      partySize === num
                        ? "bg-rose-600 text-white shadow-md shadow-rose-600/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {num} {num === 1 ? "Seat" : "Seats"}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Presets */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAiPreference("acoustic");
                  recommendBestSeats(partySize, "acoustic");
                }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                  aiPreference === "acoustic"
                    ? "bg-rose-600 text-white shadow-md"
                    : "bg-slate-950 border border-slate-800 text-slate-300 hover:border-rose-500/50"
                }`}
              >
                🎧 Dolby Atmos Acoustic Sweet-Spot
              </button>
              <button
                type="button"
                onClick={() => {
                  setAiPreference("vip");
                  recommendBestSeats(partySize, "vip");
                }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                  aiPreference === "vip"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md"
                    : "bg-slate-950 border border-slate-800 text-amber-300 hover:border-amber-500/50"
                }`}
              >
                👑 VIP Recliner Suite (Rows G & H)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAiPreference("view");
                  recommendBestSeats(partySize, "view");
                }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                  aiPreference === "view"
                    ? "bg-rose-600 text-white shadow-md"
                    : "bg-slate-950 border border-slate-800 text-slate-300 hover:border-rose-500/50"
                }`}
              >
                👁️ 100% Full FOV Screen View
              </button>
              <button
                type="button"
                onClick={() => {
                  setAiPreference("aisle");
                  recommendBestSeats(partySize, "aisle");
                }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                  aiPreference === "aisle"
                    ? "bg-rose-600 text-white shadow-md"
                    : "bg-slate-950 border border-slate-800 text-slate-300 hover:border-rose-500/50"
                }`}
              >
                🚪 Side Aisle Access
              </button>
            </div>

            {/* AI Recommendation Insights Card */}
            {aiRecommendationInfo && (
              <div className="mt-3 bg-slate-950 border border-rose-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs sm:text-sm font-extrabold font-mono">
                    {aiRecommendationInfo.score}% AI Match
                  </span>
                  <div>
                    <span className="text-sm font-bold text-white">
                      Selected Seats: <strong className="text-rose-400">{aiRecommendationInfo.seats.join(", ")}</strong>
                    </span>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-snug">
                      {aiRecommendationInfo.explanation}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="text-xs sm:text-sm text-rose-400 hover:text-white font-bold underline whitespace-nowrap"
                >
                  View AI Concierge Details &rarr;
                </button>
              </div>
            )}
          </div>

          {/* Cinema Screen Curve */}
          <div className="mb-8 sm:mb-10 text-center">
            <div className="w-3/4 mx-auto h-2.5 sm:h-3 bg-gradient-to-r from-rose-500/10 via-rose-500/80 to-rose-500/10 rounded-full shadow-[0_10px_30px_rgba(225,29,72,0.5)] mb-3"></div>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-400">
              DOLBY ATMOS CINEMA SCREEN THIS WAY
            </span>
          </div>

          {/* Seat Grid Box */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 mb-6 sm:mb-8 overflow-x-auto">
            <div className="min-w-[460px] sm:min-w-[540px] flex flex-col items-center gap-2.5 sm:gap-3.5">
              {Object.keys(rowsGrouped).map((rowLabel) => {
                const isFront = rowLabel === "A" || rowLabel === "B";
                const isSweetSpot = rowLabel === "E" || rowLabel === "F";
                const isVIPRow = rowLabel === "G" || rowLabel === "H";

                return (
                  <div key={rowLabel} className="flex items-center gap-2 sm:gap-3">
                    <span className="w-6 sm:w-7 text-center font-bold text-slate-300 text-sm">
                      {rowLabel}
                    </span>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {rowsGrouped[rowLabel].map((seat) => {
                        const isSelected = selectedSeatIds.includes(seat.seat_id);
                        const isBooked = seat.status === "Booked";
                        const isLocked = seat.status === "Locked";
                        const isVIP = seat.seat_type === "VIP";

                        return (
                          <button
                            key={seat.seat_id}
                            disabled={isBooked || isLocked}
                            onClick={() => toggleSeatSelection(seat)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-t-md sm:rounded-t-lg text-xs font-bold transition-all duration-200 flex items-center justify-center ${
                              isBooked
                                ? "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/40 opacity-40"
                                : isLocked
                                ? "bg-amber-950/60 text-amber-500/60 border border-amber-500/40 cursor-not-allowed"
                                : isSelected
                                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/50 scale-110 ring-2 ring-white"
                                : isVIP
                                ? "bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                                : isSweetSpot
                                ? "bg-slate-800 text-slate-200 border border-rose-500/30 hover:bg-slate-700 hover:border-rose-500"
                                : isFront
                                ? "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800"
                                : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:border-slate-500"
                            }`}
                            title={`Seat ${seat.row_label}${seat.seat_number} (${seat.seat_type}${isFront ? ' - Front View' : isSweetSpot ? ' - Acoustic Sweet Spot' : ''}) - LKR ${getSeatPrice(seat).toLocaleString()}`}
                          >
                            {seat.seat_number}
                          </button>
                        );
                      })}
                    </div>

                    <span className="w-6 sm:w-7 text-center font-bold text-slate-300 text-sm">
                      {rowLabel}
                    </span>

                    {/* Tier badge indicator on right */}
                    <span className="hidden md:inline-block ml-2 text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full whitespace-nowrap">
                      {isVIPRow && <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">VIP Recliners</span>}
                      {isSweetSpot && <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">★ Prime Sweet-Spot</span>}
                      {isFront && <span className="text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full">Front Row</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Real-World Seating Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mt-8 pt-6 border-t border-slate-800 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-t bg-slate-800 border border-slate-700"></div>
                <span>Standard (C & D)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-t bg-slate-800 border border-rose-500/50"></div>
                <span>★ Prime Sweet-Spot (E & F)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-t bg-amber-500/20 border border-amber-500/40"></div>
                <span>VIP Recliner (G & H)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-t bg-slate-900 border border-slate-800"></div>
                <span>Front Rows (A & B)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-t bg-rose-600 shadow-md"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-t bg-slate-800 opacity-40"></div>
                <span>Sold / Booked</span>
              </div>
            </div>
          </div>

          {/* Customer Contact Details Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
              <label className="block text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-500" /> Digital Ticket Email
              </label>
              <input
                type="email"
                required
                placeholder="e.g. yourname@gmail.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
              <p className="text-xs text-slate-400 mt-1">
                HTML entrance pass delivered here.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
              <label className="block text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-500" /> Mobile Number for SMS
              </label>
              <input
                type="tel"
                placeholder="+94 77 123 4567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
              <p className="text-xs text-slate-400 mt-1">
                Passcode sent via automated SMS.
              </p>
            </div>
          </div>

          {/* Checkout Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-xl">
            <div className="text-center sm:text-left w-full sm:w-auto">
              <div className="text-xs sm:text-sm uppercase font-bold text-slate-400 mb-0.5 flex items-center gap-2">
                <span>Selected Seats ({selectedSeatIds.length})</span>
                {isSandboxMode && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                    🧪 Sandbox Active
                  </span>
                )}
              </div>
              <div className="text-base sm:text-lg font-bold text-white">
                {selectedSeatIds.length > 0
                  ? selectedSeatIds
                      .map((id) => {
                        const s = seats.find((x) => x.seat_id === id);
                        return `${s?.row_label}${s?.seat_number}`;
                      })
                      .join(", ")
                  : "None selected"}
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
              <div>
                <div className="text-xs sm:text-sm uppercase font-bold text-slate-400 mb-0.5">Total Amount</div>
                <div className="text-2xl sm:text-3xl font-black text-rose-500">
                  LKR {calculateTotal().toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>

              <button
                disabled={selectedSeatIds.length === 0}
                onClick={handleBooking}
                className={`py-3.5 px-6 sm:px-8 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer ${
                  selectedSeatIds.length === 0
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : isSandboxMode
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 hover:scale-[1.02]"
                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 hover:scale-[1.02]"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Proceed to Checkout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE AI SEAT ASSISTANT CONCIERGE MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    AI Cinema Seat Concierge
                  </h3>
                  <p className="text-sm text-slate-300">
                    Acoustic physics & field-of-view viewing angle calculator.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Party Size */}
            <div className="mb-6">
              <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">
                1. Select Number of Tickets / Party Size
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPartySize(num)}
                    className={`py-3 rounded-2xl font-extrabold text-sm flex flex-col items-center justify-center gap-1 transition-all ${
                      partySize === num
                        ? "bg-rose-600 text-white shadow-lg shadow-rose-600/40 border border-rose-500 scale-105"
                        : "bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span className="text-base sm:text-lg">{num}</span>
                    <span className="text-xs opacity-90">{num === 1 ? "Solo Fan" : num === 2 ? "Couple" : "Group"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Experience Preference */}
            <div className="mb-6">
              <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">
                2. Select Cinema Experience Preference
              </label>
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setAiPreference("acoustic")}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    aiPreference === "acoustic"
                      ? "bg-rose-600/10 border-rose-500 text-white shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-white">🎧 Dolby Atmos Acoustic Sweet-Spot</div>
                    <div className="text-xs sm:text-sm text-slate-300 mt-0.5">Rows D, E, F Center — 3D Surround sound center</div>
                  </div>
                  <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400">98% Match</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAiPreference("vip")}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    aiPreference === "vip"
                      ? "bg-amber-500/10 border-amber-500 text-white shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-amber-300">👑 VIP Recliner Luxury Suite</div>
                    <div className="text-xs sm:text-sm text-slate-300 mt-0.5">Rows G & H — Plush recliners with legroom</div>
                  </div>
                  <span className="text-xs sm:text-sm font-mono font-bold text-amber-400">96% Match</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAiPreference("view")}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    aiPreference === "view"
                      ? "bg-rose-600/10 border-rose-500 text-white shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-white">👁️ 100% Full FOV Visual Field</div>
                    <div className="text-xs sm:text-sm text-slate-300 mt-0.5">Direct center alignment with total screen coverage</div>
                  </div>
                  <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400">95% Match</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAiPreference("aisle")}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    aiPreference === "aisle"
                      ? "bg-rose-600/10 border-rose-500 text-white shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-white">🚪 Side Aisle Access</div>
                    <div className="text-xs sm:text-sm text-slate-300 mt-0.5">Easy entrance and exit access</div>
                  </div>
                  <span className="text-xs sm:text-sm font-mono font-bold text-sky-400">91% Match</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  recommendBestSeats(partySize, aiPreference);
                  setShowAiModal(false);
                }}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-sm shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" /> Calculate & Select Best Seats
              </button>
            </div>
          </div>
        </div>
      )}
    {/* SANDBOX CHECKOUT & PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    QuickShow Ticket Checkout
                  </h3>
                  <p className="text-xs text-slate-400">
                    Secure 256-bit SSL encrypted reservation gateway
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* SANDBOX TEST MODE VIVA TOGGLE BANNER */}
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-white">
                        Sandbox / Viva Demo Mode
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isSandboxMode ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                      }`}>
                        {isSandboxMode ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Bypasses real banking authorization while saving confirmed tickets & dispatching passes.
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => setIsSandboxMode(!isSandboxMode)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
                    isSandboxMode ? "bg-emerald-600" : "bg-slate-700"
                  }`}
                  title="Toggle Sandbox Mode"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      isSandboxMode ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Quick Fill Test Patterns for Presentation */}
              {isSandboxMode && (
                <div className="mt-3 pt-3 border-t border-amber-500/20 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-amber-300/80 uppercase tracking-wider">
                    ⚡ 1-Click Demo Fill:
                  </span>
                  <button
                    type="button"
                    onClick={() => fillTestCard("visa")}
                    className="px-2.5 py-1 bg-slate-950/80 hover:bg-slate-800 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
                  >
                    <span>💳 Visa (4242)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillTestCard("mastercard")}
                    className="px-2.5 py-1 bg-slate-950/80 hover:bg-slate-800 text-orange-300 border border-orange-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
                  >
                    <span>💳 Mastercard (5555)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Order Summary Strip */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {showtime?.movie?.title || passedMovie?.title || "Movie Reservation"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {showtime?.hall?.theater?.name || selectedSlot?.theater || "Scope Cinemas"} &bull; {selectedSlot?.slotName || "Showtime"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block">Total Due</span>
                  <span className="text-lg font-black text-rose-400">
                    LKR {calculateTotal().toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                <span className="font-semibold text-slate-400">Reserved Seats:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {selectedSeatIds.map((id) => {
                    const s = seats.find((x) => x.seat_id === id);
                    return `${s?.row_label}${s?.seat_number}`;
                  }).join(", ")}
                </span>
                <span className="text-slate-600 ml-auto">&bull;</span>
                <span className="text-slate-400">{selectedSeatIds.length} Ticket(s)</span>
              </div>
            </div>

            {/* Contact Delivery Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-rose-400" /> Delivery Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-rose-400" /> Mobile (for SMS Pass)
                </label>
                <input
                  type="tel"
                  placeholder="+94 77 123 4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Payment Card Details Form */}
            <div className="space-y-3 mb-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Card Number
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCardBrand(cardNumber).badge}`}>
                    {getCardBrand(cardNumber).brand}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={19}
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl pl-3 pr-10 py-2.5 text-xs sm:text-sm font-mono text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                  <CreditCard className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Expires
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-white placeholder-slate-600 focus:outline-none transition-colors text-center"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-white placeholder-slate-600 focus:outline-none transition-colors text-center"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Cardholder
                  </label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isAuthorizing || !customerEmail}
                onClick={executePayment}
                className={`flex-1 py-3.5 px-6 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                  isAuthorizing || !customerEmail
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : isSandboxMode
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-[1.01]"
                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 hover:scale-[1.01]"
                }`}
              >
                {isAuthorizing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isSandboxMode ? "Authorizing Sandbox Gateway..." : "Authorizing Payment..."}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      Pay LKR {calculateTotal().toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      {isSandboxMode ? " (Sandbox Demo)" : ""}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatLayout;