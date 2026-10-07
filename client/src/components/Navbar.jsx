import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, X, TicketPlus, Clock } from "lucide-react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <nav className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-4 sm:px-6 md:px-10 py-3 md:py-4 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white transition-all duration-300">
      {/* LOGO */}
      <Link to="/" className="flex items-center gap-2 group">
        <h1 className="text-2xl sm:text-3xl font-black text-rose-500 tracking-tight group-hover:scale-105 transition-transform">
          QuickShow<span className="text-white text-xs font-normal ml-1 hidden sm:inline-block">LK</span>
        </h1>
      </Link>

      {/* LIVE TIME CLOCK BADGE */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-rose-500/30 rounded-full text-rose-400 font-mono shadow-md text-xs sm:text-sm">
        <Clock className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
        <span className="hidden sm:inline font-sans text-slate-300 mr-1">{formattedDate}</span>
        <span className="font-bold tracking-wider">{formattedTime}</span>
      </div>

      {/* NAVIGATION MENU */}
      <div
        className={`flex gap-6 md:gap-8 items-center
        max-md:fixed max-md:top-0 max-md:left-0
        max-md:flex-col max-md:justify-center
        max-md:bg-slate-950/98 max-md:w-full max-md:h-screen
        transition-all duration-300 text-sm font-semibold
        ${isOpen ? "max-md:flex max-md:z-50" : "max-md:hidden md:flex"}`}
      >
        <X
          className="md:hidden absolute top-6 right-6 cursor-pointer text-slate-400 hover:text-white"
          onClick={() => setIsOpen(false)}
        />

        <Link
          to="/"
          onClick={() => setIsOpen(false)}
          className="hover:text-rose-400 transition-colors py-1"
        >
          Home
        </Link>
        <Link
          to="/movies"
          onClick={() => setIsOpen(false)}
          className="hover:text-rose-400 transition-colors py-1"
        >
          Movies
        </Link>
        <Link
          to="/theaters"
          onClick={() => setIsOpen(false)}
          className="hover:text-rose-400 transition-colors py-1"
        >
          Theaters
        </Link>
        <Link
          to="/releases"
          onClick={() => setIsOpen(false)}
          className="hover:text-rose-400 transition-colors py-1"
        >
          Releases
        </Link>
        <Link
          to="/favourite"
          onClick={() => setIsOpen(false)}
          className="hover:text-rose-400 transition-colors py-1"
        >
          Favourites
        </Link>
      </div>

      {/* RIGHT SIDE ACTIONS */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Search
          className="w-5 h-5 cursor-pointer text-slate-400 hover:text-white transition-colors"
          onClick={() => navigate("/movies")}
        />

        {!user ? (
          <button
            onClick={() => openSignIn()}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-full shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
          >
            Sign In
          </button>
        ) : (
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action
                label="My Bookings"
                labelIcon={<TicketPlus width={15} />}
                onClick={() => navigate("/my-bookings")}
              />
            </UserButton.MenuItems>
          </UserButton>
        )}

        <Menu
          className="md:hidden w-6 h-6 cursor-pointer text-slate-300 hover:text-white"
          onClick={() => setIsOpen(true)}
        />
      </div>
    </nav>
  );
};

export default Navbar;