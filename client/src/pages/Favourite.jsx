import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Trash2, Film, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { getFavourites, clearAllFavourites, getFavouritesStorageKey } from "../lib/favourites";
import toast from "react-hot-toast";

const Favourite = () => {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const activeEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    localStorage.getItem("customer_email") ||
    "";

  const [favourites, setFavourites] = useState(() => getFavourites(activeEmail));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isClerkLoaded) return;

    if (!activeEmail) {
      setFavourites([]);
      setLoading(false);
      return;
    }

    const refreshFavourites = async () => {
      setLoading(true);
      const local = getFavourites(activeEmail);
      setFavourites(local);
      try {
        const token = localStorage.getItem("token") || "";
        const url = `/api/favourites?email=${encodeURIComponent(activeEmail)}`;
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const dbFavs = await res.json();
          if (Array.isArray(dbFavs)) {
            setFavourites(dbFavs);
            localStorage.setItem(getFavouritesStorageKey(activeEmail), JSON.stringify(dbFavs));
          }
        }
      } catch (err) {
        console.debug("Favourites backend sync note:", err);
      } finally {
        setLoading(false);
      }
    };

    refreshFavourites();

    const handleUpdate = () => setFavourites(getFavourites(activeEmail));
    window.addEventListener("favouritesUpdated", handleUpdate);
    window.addEventListener("userChanged", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("favouritesUpdated", handleUpdate);
      window.removeEventListener("userChanged", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [isClerkLoaded, activeEmail]);

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to remove all saved movies from your favourites?")) {
      await clearAllFavourites(activeEmail);
      setFavourites([]);
      toast("Favourites list cleared", { icon: "🗑️" });
    }
  };

  return (
    <div className="relative pt-28 md:pt-36 pb-24 px-6 sm:px-12 md:px-16 lg:px-28 xl:px-40 overflow-hidden min-h-[85vh] bg-slate-950">
      <BlurCircle top="120px" left="0px" />
      <BlurCircle bottom="80px" right="60px" />

      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-xs sm:text-sm font-bold mb-3 border border-rose-500/20">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" /> Personal Watchlist & Favourites
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Your Favourite Movies
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-xl">
            Quickly access and book tickets for the movies you have saved. Tap the glowing heart icon to manage your selection.
          </p>
        </div>

        {favourites.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 font-bold text-sm">
              {favourites.length} {favourites.length === 1 ? "Movie Saved" : "Movies Saved"}
            </span>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto">
        {loading && favourites.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-28 gap-4">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-medium animate-pulse">
              Retrieving your saved favourites from database...
            </p>
          </div>
        ) : favourites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center sm:justify-items-stretch">
            {favourites.map((movie) => (
              <MovieCard
                movie={movie}
                key={movie.id || movie.movie_id || movie._id}
              />
            ))}
          </div>
        ) : (
          
          <div className="py-20 px-6 max-w-md mx-auto text-center bg-slate-900/60 border border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-sm my-8">
            <div className="w-20 h-20 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner shadow-rose-500/20">
              <Heart className="w-10 h-10 text-rose-500 stroke-[1.5]" />
            </div>

            <h2 className="text-2xl font-black text-white mb-2">No Favourites Yet</h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              Explore trending movies showing in Sri Lankan cinemas and tap the heart icon on any movie to save it here for quick access.
            </p>

            <button
              onClick={() => navigate("/movies")}
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-2xl text-base shadow-xl shadow-rose-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Film className="w-5 h-5" /> Explore Now Showing Movies
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favourite;
