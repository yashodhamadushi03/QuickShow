import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, X, TicketPlus, Clock, Film, ShieldCheck, User } from "lucide-react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import AuthModal from "./AuthModal";
import ProfileModal from "./ProfileModal";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const { user } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  // Live Time Clock Effect (updates every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchModal(false);
      setSearchQuery("");
    }
  };

  return (
    <nav className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-4 sm:px-6 md:px-10 py-3 md:py-4 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white transition-all duration-300">
      {/* LOGO */}
      <Link to="/" className="flex items-center gap-2 group">
        <h1 className="text-2xl sm:text-3xl font-black text-rose-500 tracking-tight group-hover:scale-105 transition-transform">
          QuickShow<span className="text-white text-sm font-semibold ml-1 hidden sm:inline-block">LK</span>
        </h1>
      </Link>

      {/* LIVE TIME CLOCK BADGE */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 border border-rose-500/30 rounded-full text-rose-400 font-mono shadow-md text-sm sm:text-base">
        <Clock className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
        <span className="hidden sm:inline font-sans text-slate-300 mr-1 font-semibold">{formattedDate}</span>
        <span className="font-extrabold tracking-wider">{formattedTime}</span>
      </div>

      {/* NAVIGATION MENU */}
      <div
        className={`flex gap-6 md:gap-9 items-center
        max-md:fixed max-md:top-0 max-md:left-0
        max-md:flex-col max-md:justify-center
        max-md:bg-slate-950/98 max-md:w-full max-md:h-screen
        transition-all duration-300 text-base md:text-lg font-bold
        ${isOpen ? "max-md:flex max-md:z-50" : "max-md:hidden md:flex"}`}
      >
        <X
          className="md:hidden absolute top-6 right-6 cursor-pointer text-slate-400 hover:text-white"
          onClick={() => setIsOpen(false)}
        />

        <Link
          to="/"
          onClick={() => setIsOpen(false)}
          className="hover:text-rose-400 text-slate-200 transition-colors py-1"
        >
          Home
        </Link>
        <Link
          to="/movies"
          onClick={() => setIsOpen(false)}
          className="hover:text-rose-400 text-slate-200 transition-colors py-1"
        >
          Movies
        </Link>
        <Link
          to="/theaters"
          onClick={() => setIsOpen(false)}
          className="hover:text-rose-400 text-slate-200 transition-colors py-1"
        >
          Theaters
        </Link>
        <Link
          to="/releases"
          onClick={() => setIsOpen(false)}
          className="hover:text-rose-400 text-slate-200 transition-colors py-1"
        >
          Releases
        </Link>
        <Link
          to="/favourite"
          onClick={() => setIsOpen(false)}
          className="hover:text-rose-400 text-slate-200 transition-colors py-1"
        >
          Favourites
        </Link>
        <Link
          to="/admin"
          onClick={() => setIsOpen(false)}
          className="hover:text-rose-300 text-rose-400 font-extrabold transition-colors py-1 flex items-center gap-1.5"
        >
          <ShieldCheck className="w-5 h-5 text-amber-300" /> Admin Dashboard
        </Link>
      </div>

      {/* RIGHT SIDE ACTIONS */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Interactive Search Trigger Icon */}
        <button
          onClick={() => setShowSearchModal(!showSearchModal)}
          className="p-2.5 text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-full transition-colors cursor-pointer"
          title="Search Movies"
        >
          <Search className="w-5 h-5" />
        </button>

        {!user ? (
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm sm:text-base px-5 sm:px-6 py-2.5 rounded-full shadow-lg shadow-rose-600/30 transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
          >
            <User className="w-4 h-4" /> Sign In / Admin
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfileModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Edit Profile & Phone"
            >
              <User className="w-3.5 h-3.5 text-rose-500" />
              <span>Profile</span>
            </button>
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="My Profile Details"
                  labelIcon={<User width={15} />}
                  onClick={() => setShowProfileModal(true)}
                />
                <UserButton.Action
                  label="My Bookings"
                  labelIcon={<TicketPlus width={15} />}
                  onClick={() => navigate("/my-bookings")}
                />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        )}

        <Menu
          className="md:hidden w-6 h-6 cursor-pointer text-slate-300 hover:text-white"
          onClick={() => setIsOpen(true)}
        />
      </div>

      {/* DUAL ROLE AUTHENTICATION MODAL */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* USER PROFILE & CONTACT DETAILS MODAL */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

      {/* Interactive Search Overlay Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 top-16 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-8 px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-rose-400 text-sm font-bold">
                <Film className="w-4 h-4" /> Live Movie Search
              </div>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-rose-500" />
              <input
                type="text"
                autoFocus
                placeholder="Type movie name (e.g. Dune, Avatar, Kandak Sema, GOAT)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl pl-12 pr-28 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-lg transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;