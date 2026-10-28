import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Film,
  Camera,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Ticket,
  HelpCircle
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:8000/api";

const CITIES = [
  "Colombo",
  "Kandy",
  "Galle",
  "Negombo",
  "Jaffna",
  "Kurunegala",
  "Nuwara Eliya",
  "Batticaloa",
];

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Colombo");
  const [preferredTheaterId, setPreferredTheaterId] = useState("");
  const [theaters, setTheaters] = useState([]);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAlreadyComplete, setIsAlreadyComplete] = useState(false);

  // 1. Fetch available theaters for the dropdown
  useEffect(() => {
    fetch(`${API_BASE_URL}/theaters`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setTheaters(data);
          if (data.length > 0 && !preferredTheaterId) {
            setPreferredTheaterId(data[0].theater_id.toString());
          }
        }
      })
      .catch((err) => console.debug("Error fetching theaters:", err));
  }, []);

  // 2. Auth Guard & Profile Status Check from MySQL
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      navigate("/sign-in", {
        replace: true,
        state: { returnUrl: "/complete-profile" },
      });
      return;
    }

    const activeEmail =
      clerkUser?.primaryEmailAddress?.emailAddress ||
      clerkUser?.emailAddresses?.[0]?.emailAddress ||
      "";

    const clerkName =
      clerkUser?.fullName ||
      `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() ||
      clerkUser?.username ||
      "";

    const clerkAvatar = clerkUser?.imageUrl || "";

    setEmail(activeEmail);
    if (clerkName) setName(clerkName);
    if (clerkAvatar) setAvatarUrl(clerkAvatar);

    if (activeEmail) {
      setIsCheckingStatus(true);
      fetch(`${API_BASE_URL}/users/status?email=${encodeURIComponent(activeEmail)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.exists) {
            if (data.name) setName(data.name);
            if (data.phone) setPhone(data.phone);
            if (data.city) setCity(data.city);
            if (data.bio) setBio(data.bio);
            if (data.avatar_url) setAvatarUrl(data.avatar_url);
            if (data.preferred_theater_id) {
              setPreferredTheaterId(data.preferred_theater_id.toString());
            }

            // Check if profile was already complete
            if (data.is_completed) {
              setIsAlreadyComplete(true);
              sessionStorage.setItem(`profile_completed_${clerkUser.id}`, "true");
              // If not explicitly opened with ?edit=true, auto-redirect to Home
              const searchParams = new URLSearchParams(location.search);
              if (searchParams.get("edit") !== "true") {
                navigate("/", { replace: true });
              }
            }
          }
        })
        .catch((err) => console.debug("Check profile status error:", err))
        .finally(() => setIsCheckingStatus(false));
    } else {
      setIsCheckingStatus(false);
    }
  }, [isLoaded, isSignedIn, clerkUser, navigate, location.search]);

  // 3. Form Submission to MySQL
  const handleSaveAndContinue = async (e) => {
    e.preventDefault();

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      toast.error("Please enter a valid phone number for SMS ticket delivery.", {
        icon: "📱",
      });
      return;
    }

    // Basic phone validation (at least 9 digits)
    const digitsOnly = cleanPhone.replace(/\D/g, "");
    if (digitsOnly.length < 9) {
      toast.error("Please enter a complete phone number (e.g., +94 77 123 4567).", {
        icon: "⚠️",
      });
      return;
    }

    setIsSaving(true);
    const payload = {
      email,
      name: name.trim() || "Cinema Member",
      phone: cleanPhone,
      phone_number: cleanPhone,
      city,
      preferred_theater_id: preferredTheaterId ? parseInt(preferredTheaterId) : null,
      bio: bio.trim(),
      avatar_url: avatarUrl.trim(),
    };

    try {
      // Primary call: POST /api/users/profile
      let res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Fallback call: PUT /api/users/profile
      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/users/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const savedData = await res.json();

        // Update local session state
        localStorage.setItem("customer_name", savedData.name || name);
        localStorage.setItem("customer_phone", cleanPhone);
        if (clerkUser?.id) {
          sessionStorage.setItem(`profile_completed_${clerkUser.id}`, "true");
        }
        window.dispatchEvent(new Event("profileUpdated"));

        toast.success("Welcome! Profile setup completed successfully.", {
          icon: "🎉",
          duration: 3500,
        });

        // Smooth redirect to Home Page (/)
        navigate("/", { replace: true });
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to save profile. Please try again.");
      }
    } catch (err) {
      toast.error(err.message || "Error saving profile. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded || isCheckingStatus) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
        <div className="w-14 h-14 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-300 font-semibold text-sm tracking-wide">
          Verifying your QuickShow cinema account...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient Cinema Lighting Effects */}
      <div className="absolute top-1/6 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-rose-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Brand Header */}
      <div className="w-full max-w-xl mb-6 flex items-center justify-between z-10">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="text-2xl font-black text-rose-500 tracking-tight">
            QuickShow<span className="text-white text-sm font-semibold ml-1">LK</span>
          </span>
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <Sparkles className="w-3.5 h-3.5" />
          Member Onboarding
        </span>
      </div>

      {/* Stepper Progress Indicator */}
      <div className="w-full max-w-xl mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl z-10 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs">
          {/* Step 1: Authentication */}
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span>1. Google Sign-In</span>
          </div>

          <div className="flex-1 h-0.5 mx-3 bg-gradient-to-r from-emerald-500/40 to-rose-500/40"></div>

          {/* Step 2: Profile Details */}
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-xs text-white">
              2
            </div>
            <span>2. Profile & Contact</span>
          </div>

          <div className="flex-1 h-0.5 mx-3 bg-slate-800"></div>

          {/* Step 3: Enjoy Movies */}
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-400">
              3
            </div>
            <span>3. Movie Tickets</span>
          </div>
        </div>
      </div>

      {/* Main Profile Form Card */}
      <div className="w-full max-w-xl bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Card Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            Complete Your Cinema Profile
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
            Welcome to QuickShow! To receive instant digital ticket passes and SMS entrance alerts,
            please complete your contact details below.
          </p>
        </div>

        {/* Profile Completed Banner (if revisiting) */}
        {isAlreadyComplete && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Your profile is already verified in our MySQL database.</span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/", { replace: true })}
              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-xl transition-colors shrink-0"
            >
              Go to Home →
            </button>
          </div>
        )}

        <form onSubmit={handleSaveAndContinue} className="space-y-4">
          {/* Avatar & Google Identity Banner */}
          <div className="flex items-center gap-4 p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || "Avatar"}
                  onError={() => setAvatarUrl("")}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-md"
                />
              ) : (
                <div className="w-14 h-14 bg-gradient-to-tr from-rose-600 to-amber-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md">
                  {(name || "U")[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <Camera className="w-3 h-3 text-rose-400" /> Avatar Image URL (Optional)
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-rose-500" /> Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kasun Kalhara"
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
            />
          </div>

          {/* Registered Email (Read-Only OAuth) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" /> Verified Email Address
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> OAuth Verified
              </span>
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full bg-slate-950/60 border border-slate-800/60 rounded-xl px-4 py-3 text-sm text-slate-400 cursor-not-allowed font-mono"
            />
          </div>

          {/* Personal Phone Number (Essential Onboarding Field) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> Mobile / Phone Number
                <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-rose-400 font-semibold">Required for SMS Tickets</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+94 77 123 4567"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors font-mono tracking-wide"
            />
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Ticket className="w-3 h-3 text-emerald-400 shrink-0" />
              Saved exclusively to your account for seat reservation confirmations and cinema check-ins.
            </p>
          </div>

          {/* Preferred City & Preferred Theater Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Preferred City */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Cinema City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none transition-colors cursor-pointer"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c} (Sri Lanka)
                  </option>
                ))}
              </select>
            </div>

            {/* Preferred Theater */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-rose-400" /> Favorite Theater Branch
              </label>
              <select
                value={preferredTheaterId}
                onChange={(e) => setPreferredTheaterId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none transition-colors cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-400">
                  Select Favorite Theater
                </option>
                {theaters.map((t) => (
                  <option key={t.theater_id} value={t.theater_id} className="bg-slate-900 text-white">
                    {t.name} ({t.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bio / Movie Preferences */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Cinema Bio & Favorite Genres (Optional)
            </label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Sci-Fi enthusiast, IMAX lover, Christopher Nolan fan"
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold rounded-2xl text-sm shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Synchronizing to MySQL Database...</span>
                </>
              ) : (
                <>
                  <span>Save & Continue to Home</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
