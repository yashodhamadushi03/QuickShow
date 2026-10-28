import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  AlertCircle
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

const OnboardingModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user: clerkUser } = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Colombo");
  const [preferredTheaterId, setPreferredTheaterId] = useState("");
  const [theaters, setTheaters] = useState([]);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Fetch available theaters for dropdown
  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API_BASE_URL}/theaters`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTheaters(data);
          if (!preferredTheaterId) {
            setPreferredTheaterId(data[0].theater_id.toString());
          }
        }
      })
      .catch((err) => console.debug("Error fetching theaters:", err));
  }, [isOpen]);

  // 2. Pre-populate from Clerk / Google OAuth
  useEffect(() => {
    if (!isOpen || !clerkUser) return;

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

    // Fetch existing details if any
    if (activeEmail) {
      fetch(`${API_BASE_URL}/users/profile?email=${encodeURIComponent(activeEmail)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            if (data.name) setName(data.name);
            if (data.phone || data.phone_number) {
              setPhone(data.phone || data.phone_number);
            }
            if (data.city) setCity(data.city);
            if (data.bio) setBio(data.bio);
            if (data.preferred_theater_id) {
              setPreferredTheaterId(data.preferred_theater_id.toString());
            }
          }
        })
        .catch((err) => console.debug("Error loading profile:", err));
    }
  }, [isOpen, clerkUser]);

  if (!isOpen) return null;

  // 3. Form Submission
  const handleSaveAndContinue = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setErrorMsg("Please enter your phone number to receive digital SMS ticket passes.");
      return;
    }

    const digitsOnly = cleanPhone.replace(/\D/g, "");
    if (digitsOnly.length < 9) {
      setErrorMsg("Please enter a valid phone number with at least 9 digits (e.g. +94 77 123 4567).");
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

        // Update local session caches
        localStorage.setItem("customer_name", savedData.name || name);
        localStorage.setItem("customer_phone", cleanPhone);
        if (clerkUser?.id) {
          sessionStorage.setItem(`profile_completed_${clerkUser.id}`, "true");
        }
        window.dispatchEvent(new Event("profileUpdated"));

        toast.success("Profile verified & saved! Welcome to QuickShow LK.", {
          icon: "🎉",
          duration: 3500,
        });

        // Close modal and smoothly redirect to Home Page (/)
        if (onClose) onClose();
        navigate("/", { replace: true });
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to update profile. Please try again.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to save profile. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
    >
      <div className="relative w-full max-w-lg my-auto bg-slate-900/95 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/50 backdrop-blur-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 bg-gradient-to-b from-rose-500/20 to-transparent blur-3xl pointer-events-none"></div>

        {/* Brand & Step Badge */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-rose-500 tracking-tight">
              QuickShow<span className="text-white text-xs font-semibold ml-1">LK</span>
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <Sparkles className="w-3.5 h-3.5" />
            Mandatory Onboarding
          </span>
        </div>

        {/* Title & Explanatory Instructions */}
        <div className="mb-6 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
            Complete Your Cinema Profile
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
            Welcome to QuickShow! To reserve cinema seats and receive instant SMS ticket entrance barcodes, please complete your mandatory contact details below before proceeding.
          </p>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="mb-5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs relative z-10">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span>1. Google Sign-In</span>
          </div>

          <div className="flex-1 h-0.5 mx-3 bg-gradient-to-r from-emerald-500/40 to-rose-500/40"></div>

          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-[10px] text-white">
              2
            </div>
            <span>2. Mobile & Preferences</span>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300 relative z-10">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveAndContinue} className="space-y-4 relative z-10">
          {/* Avatar & Google Identity Summary */}
          <div className="flex items-center gap-3.5 p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || "Avatar"}
                  onError={() => setAvatarUrl("")}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-tr from-rose-600 to-amber-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
                  {(name || "U")[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate block">
                  {name || "Cinema Member"}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3 h-3" /> Google Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate">{email}</p>
            </div>
          </div>

          {/* Full Name Field */}
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
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
            />
          </div>

          {/* Phone Number Field (MANDATORY) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> Mobile / Phone Number
                <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-rose-400 font-semibold">Mandatory for SMS Tickets</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+94 77 123 4567"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors font-mono tracking-wide"
            />
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Ticket className="w-3 h-3 text-emerald-400 shrink-0" />
              Unique to your account. Used for digital seat QR passes and theater check-in.
            </p>
          </div>

          {/* Preferred City & Cinema Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Cinema City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors cursor-pointer"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c} (Sri Lanka)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-rose-400" /> Favorite Theater Branch
              </label>
              <select
                value={preferredTheaterId}
                onChange={(e) => setPreferredTheaterId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors cursor-pointer"
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

          {/* Cinema Bio / Preferences (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Favorite Movie Genres (Optional)
            </label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Sci-Fi, IMAX, Marvel, Christopher Nolan films"
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Prominent Save & Continue Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold rounded-2xl text-sm shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving to MySQL Database...</span>
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

export default OnboardingModal;
