import React, { useState, useEffect } from "react";
import { Search, Film, Star, Sparkles, Filter, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";

const API_BASE_URL = "http://localhost:8000/api";

const Movies = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("search") || "";

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [selectedGenre, setSelectedGenre] = useState("All");

  const fallbackMovies = [
    {
      movie_id: 1,
      title: "Avatar: The Way of Water",
      genre: "Sci-Fi / Action",
      language: "English",
      duration_min: 192,
      rating: "PG-13",
      poster_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800",
      description: "Jake Sully lives with his family on Pandora while protecting their home from familiar threats."
    },
    {
      movie_id: 2,
      title: "Dune: Part Two",
      genre: "Sci-Fi / Adventure",
      language: "English",
      duration_min: 166,
      rating: "PG-13",
      poster_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
      description: "Paul Atreides unites with Chani and the Fremen to seek revenge against those who destroyed his family."
    },
    {
      movie_id: 3,
      title: "Kandak Sema",
      genre: "Drama / Romance",
      language: "Sinhala",
      duration_min: 135,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800",
      description: "A poignant Sri Lankan cinema drama depicting love, resilience, and personal triumph."
    },
    {
      movie_id: 4,
      title: "The Greatest Of All Time (GOAT)",
      genre: "Action / Sci-Fi",
      language: "Tamil",
      duration_min: 178,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800",
      description: "An action-packed sci-fi thriller featuring dual roles and high-octane suspense across international missions."
    },
    {
      movie_id: 5,
      title: "Oppenheimer",
      genre: "Biography / Drama",
      language: "English",
      duration_min: 180,
      rating: "R",
      poster_url: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800",
      description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb."
    },
    {
      movie_id: 6,
      title: "Spider-Man: Across the Spider-Verse",
      genre: "Animation / Action",
      language: "English",
      duration_min: 140,
      rating: "PG",
      poster_url: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=800",
      description: "Miles Morales catapults across the Multiverse to protect its existence alongside Spider-People."
    },
    {
      movie_id: 7,
      title: "Stree 2",
      genre: "Comedy / Horror",
      language: "Hindi",
      duration_min: 147,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=800",
      description: "The town of Chanderi is haunted once again by a headless entity known as Sarkata."
    }
  ];

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/movies`);
      if (res.ok) {
        const data = await res.json();
        setMovies(data.length > 0 ? data : fallbackMovies);
      } else {
        setMovies(fallbackMovies);
      }
    } catch (err) {
      console.warn("Backend API unavailable, using fallback movies data.", err);
      setMovies(fallbackMovies);
    } finally {
      setLoading(false);
    }
  };

  const languages = ["All", "English", "Sinhala", "Tamil", "Hindi"];
  const genres = ["All", "Action", "Sci-Fi", "Drama", "Comedy", "Horror", "Animation"];

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch =
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.language.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLang = selectedLanguage === "All" || movie.language.toLowerCase().includes(selectedLanguage.toLowerCase());
    const matchesGenre = selectedGenre === "All" || movie.genre.toLowerCase().includes(selectedGenre.toLowerCase());

    return matchesSearch && matchesLang && matchesGenre;
  });

  return (
    <div className="relative min-h-screen bg-slate-950 text-white pt-24 pb-20 px-6 md:px-16 overflow-hidden">
      <BlurCircle top="100px" left="-100px" />
      <BlurCircle bottom="100px" right="-100px" />

      {/* Header & Interactive Live Search Bar */}
      <div className="max-w-7xl mx-auto mb-10 border-b border-slate-800 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-sm font-medium mb-3 border border-rose-500/20">
              <Sparkles className="w-4 h-4" /> QuickShow Movie Catalog
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Now Showing Movies
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-2">
              Browse blockbusters screening across Scope Cinemas, Savoy, PVR, and Regal.
            </p>
          </div>

          {/* Search Input Box */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-rose-500" />
            <input
              type="text"
              placeholder="Search movie by title, genre, or language..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchParams(e.target.value ? { search: e.target.value } : {});
              }}
              className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500 rounded-2xl pl-12 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all shadow-lg shadow-black/40"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchParams({});
                }}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Language & Genre Filters */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          {/* Language Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-rose-500" /> Language:
            </span>
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedLanguage === lang
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Genre Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mr-2">Genre:</span>
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedGenre === genre
                    ? "bg-slate-800 text-rose-400 border border-rose-500/40"
                    : "bg-slate-900/50 border border-slate-800/80 text-slate-400 hover:text-slate-200"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800">
            <Film className="w-14 h-14 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-1">No Movies Found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              No movies match "{searchQuery}". Try searching for another title or clear your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedLanguage("All");
                setSelectedGenre("All");
                setSearchParams({});
              }}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredMovies.map((movie) => (
              <div
                key={movie.movie_id}
                className="group relative bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-rose-950/30 flex flex-col justify-between"
              >
                {/* Poster Container */}
                <div className="relative aspect-[2/3] overflow-hidden bg-slate-950">
                  <img
                    src={movie.poster_url || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800"}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Rating & Language Badge */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 bg-rose-600/90 text-white text-xs font-bold rounded-md uppercase shadow">
                      {movie.rating || "U/A"}
                    </span>
                    <span className="px-2.5 py-1 bg-slate-950/90 text-slate-200 text-xs font-bold rounded-md border border-slate-800 uppercase shadow">
                      {movie.language}
                    </span>
                  </div>
                </div>

                {/* Info Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-rose-400 mb-1.5 uppercase tracking-wide">
                      {movie.genre}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-rose-400 transition-colors">
                      {movie.title}
                    </h3>
                    <p className="text-slate-300 text-sm line-clamp-2 mb-4 leading-relaxed">
                      {movie.description}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="text-sm text-slate-300 font-mono">
                      {movie.duration_min} mins
                    </div>
                    <Link
                      to={`/movies/${movie.movie_id}`}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl shadow-md shadow-rose-600/20 transition-all hover:scale-105"
                    >
                      Book Tickets &rarr;
                    </Link>
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

export default Movies;
