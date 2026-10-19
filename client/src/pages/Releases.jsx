import React, { useState, useEffect } from "react";
import { Calendar, Bell, Film, Play, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import { FALLBACK_POSTER } from "../assets/assets";

const API_BASE_URL = "http://localhost:8000/api";

const Releases = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState({});

  const fallbackReleases = [
    {
      movie_id: 101,
      title: "Devara: Part 1",
      genre: "Action / Drama / Epic",
      language: "Tamil / Telugu",
      duration_min: 170,
      rating: "U/A",
      release_date: "2024-09-27",
      status: "Coming Soon",
      poster_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800",
      description: "An epic action saga set against coastal lands, depicting ancestral bloodlines, seafaring contraband, and legendary courage."
    },
    {
      movie_id: 102,
      title: "Sinhabahu",
      genre: "Historical / Epic Drama",
      language: "Sinhala",
      duration_min: 145,
      rating: "U",
      release_date: "2024-10-18",
      status: "Coming Soon",
      poster_url: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=800",
      description: "The monumental Sri Lankan folklore legend of royal lineage, filial duty, and tragedy adapted into a grand cinematic spectacle."
    },
    {
      movie_id: 103,
      title: "Joker: Folie à Deux",
      genre: "Crime / Drama / Musical",
      language: "English",
      duration_min: 138,
      rating: "R",
      release_date: "2024-10-04",
      status: "Coming Soon",
      poster_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800",
      description: "Arthur Fleck navigates his fractured mind and dual identity while discovering dark romance within Arkham State Hospital."
    },
    {
      movie_id: 104,
      title: "Kanguva",
      genre: "Action / Fantasy / Epic",
      language: "Tamil",
      duration_min: 154,
      rating: "U/A",
      release_date: "2024-11-14",
      status: "Coming Soon",
      poster_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
      description: "A warrior's battle for tribal independence across ancient centuries echoes into a modern-day shadow operative's destiny."
    },
    {
      movie_id: 105,
      title: "Gladiator II",
      genre: "Action / History / Epic",
      language: "English",
      duration_min: 150,
      rating: "R",
      release_date: "2024-11-22",
      status: "Coming Soon",
      poster_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800",
      description: "Lucius enters the legendary Colosseum years after Maximus's sacrifice to overthrow emperor tyranny and reclaim the honor of Rome."
    },
    {
      movie_id: 106,
      title: "Interstellar: 10th Anniversary IMAX",
      genre: "Sci-Fi / Drama",
      language: "English",
      duration_min: 169,
      rating: "PG-13",
      release_date: "2024-12-06",
      status: "Coming Soon",
      poster_url: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800",
      description: "Christopher Nolan's landmark sci-fi space odyssey returns to IMAX screens with full remastered sound and breathtaking visuals."
    }
  ];

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/movies`);
      if (response.ok) {
        const data = await response.json();
        const comingSoon = data.filter((m) => m.status === "Coming Soon");
        setMovies(comingSoon.length > 0 ? comingSoon : fallbackReleases);
      } else {
        setMovies(fallbackReleases);
      }
    } catch (err) {
      console.warn("Backend API unavailable, using fallback releases data.", err);
      setMovies(fallbackReleases);
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = (movieId, title) => {
    setReminders((prev) => {
      const updated = !prev[movieId];
      if (updated) {
        toast.success(`Reminder set! We'll notify you when Scope & Savoy tickets open for ${title}.`, {
          icon: "🎟️",
          style: { background: "#1e293b", color: "#fff", border: "1px solid #e11d48" }
        });
      } else {
        toast("Reminder removed", { style: { background: "#1e293b", color: "#94a3b8" } });
      }
      return { ...prev, [movieId]: updated };
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-16 px-6 md:px-16">
      {/* Hero Header */}
      <div className="max-w-7xl mx-auto mb-12 text-center md:text-left border-b border-slate-800 pb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-sm font-medium mb-4 border border-rose-500/20">
          <Calendar className="w-4 h-4" /> Upcoming Releases in Sri Lanka
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
          Coming Soon & Movie Premieres
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Set pre-booking alerts for upcoming English, Sinhala, and Tamil blockbusters releasing across Scope Cinemas & Savoy Theaters.
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {movies.map((movie) => (
              <div
                key={movie.movie_id}
                className="group bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-rose-950/30 flex flex-col sm:flex-row"
              >
                {/* Poster Image */}
                <div className="sm:w-2/5 relative overflow-hidden bg-slate-950 shrink-0">
                  <img
                    src={movie.poster_url || FALLBACK_POSTER}
                    alt={movie.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_POSTER;
                    }}
                    className="w-full h-64 sm:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-rose-600/90 text-white text-xs font-bold rounded-md shadow-md uppercase tracking-wider">
                    {movie.rating || "U/A"}
                  </div>
                </div>

                {/* Details */}
                <div className="sm:w-3/5 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-rose-400 text-xs sm:text-sm font-bold mb-2 uppercase tracking-wide">
                      <Film className="w-4 h-4" /> {movie.genre}
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-rose-400 transition-colors">
                      {movie.title}
                    </h2>

                    <p className="text-slate-300 text-sm line-clamp-3 mb-4 leading-relaxed">
                      {movie.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 mb-4">
                      <div>
                        <span className="text-slate-400 block uppercase font-semibold text-xs tracking-wider mb-0.5">Release Date</span>
                        <span className="font-bold text-rose-300 text-sm">{movie.release_date || "Coming Soon"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-semibold text-xs tracking-wider mb-0.5">Language</span>
                        <span className="font-bold text-slate-200 text-sm">{movie.language}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => toggleReminder(movie.movie_id, movie.title)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        reminders[movie.movie_id]
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                          : "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30"
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                      {reminders[movie.movie_id] ? "Alert Set ✓" : "Pre-Book Alert"}
                    </button>

                    <button
                      onClick={() =>
                        toast("Official trailer coming soon to QuickShow Sri Lanka!", {
                          icon: "🎬",
                          style: { background: "#1e293b", color: "#fff" }
                        })
                      }
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                      title="Watch Trailer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Releases;
