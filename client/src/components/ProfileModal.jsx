import React, { useState, useEffect } from "react";
import { X, User, Phone, Mail, MapPin, Sparkles, Check, Camera, FileText } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config";

const CITIES = [
  "Colombo",
  "Kandy",
  "Jaffna",
  "Galle",
  "Negombo",
  "Kurunegala",
  "Nuwara Eliya",
  "Batticaloa",
];

const ProfileModal = ({ isOpen, onClose }) => {
  const { user: clerkUser } = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("Colombo");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (!isOpen) return;

    const activeEmail =
      clerkUser?.primaryEmailAddress?.emailAddress ||
      clerkUser?.emailAddresses?.[0]?.emailAddress ||
      localStorage.getItem("customer_email") ||
      localStorage.getItem("user_email") ||
      "";

    setEmail(activeEmail);
    setName(
      clerkUser?.fullName ||
        clerkUser?.firstName ||
        localStorage.getItem("customer_name") ||
        ""
    );
    setAvatarUrl(clerkUser?.imageUrl || "");

    if (activeEmail) {
      setIsLoading(true);
      const token = localStorage.getItem("token") || "";
      fetch(`${API_BASE_URL}/users/profile?email=${encodeURIComponent(activeEmail)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            if (data.name) setName(data.name);
            if (data.phone_number || data.phone) setPhone(data.phone_number || data.phone);
            if (data.bio) setBio(data.bio);
            if (data.city) setCity(data.city);
            if (data.avatar_url) setAvatarUrl(data.avatar_url);
          }
        })
        .catch((err) => console.debug("Load profile error:", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, clerkUser]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please sign in to update your profile.");
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem("token") || "";

    const payload = {
      email,
      name: name.trim(),
      phone_number: phone.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      city,
      avatar_url: avatarUrl.trim(),
    };

    try {
      let res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/auth/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const updated = await res.json();
        localStorage.setItem("customer_name", updated.name || name);
        localStorage.setItem("customer_phone", updated.phone_number || updated.phone || phone);
        window.dispatchEvent(new Event("profileUpdated"));
        toast.success("Profile saved and synchronized to MySQL database!", {
          icon: "💾",
        });
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update profile.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Personal Profile & Contact
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Update your details to sync with our MySQL database
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-medium">Loading your profile from MySQL...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Avatar & Initials Preview */}
            <div className="flex items-center gap-4 p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    onError={() => setAvatarUrl("")}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-tr from-rose-600 to-amber-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md">
                    {(name || "U")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <Camera className="w-3 h-3 text-rose-400" /> Avatar Image URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-rose-500" /> Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Yashodha Nelundeniya"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
              />
            </div>

            {/* Email Address (Read-Only) */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" /> Registered Email
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-slate-950/60 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Email is verified via OAuth authentication.
              </span>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> Personal Contact / Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 77 123 4567"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Saved individually to your account for SMS e-ticket entrance alerts.
              </span>
            </div>

            {/* Preferred Cinema City */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Preferred Cinema City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c} (Sri Lanka)
                  </option>
                ))}
              </select>
            </div>

            {/* Cinema Bio */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" /> Cinema Bio & Favorites
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your favorite movie genres, directors, or cinemas..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
              ></textarea>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving to MySQL...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Profile Details
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
