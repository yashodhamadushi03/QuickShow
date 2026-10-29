import React, { useState, useEffect } from "react";
import { Search, Film, Star, Sparkles, Filter, X, MapPin } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";

import { FALLBACK_POSTER } from "../assets/assets";
import { API_BASE_URL } from "../config";

const Movies = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("search") || "";
  const theaterIdParam = searchParams.get("theater_id");
  const theaterNameParam = searchParams.get("theater_name");
  const hallIdParam = searchParams.get("hall_id");
  const hallNameParam = searchParams.get("hall_name");

  const buildMovieBookingUrl = (movieId) => {
    const params = new URLSearchParams();
    if (theaterIdParam) params.set("theater_id", theaterIdParam);
    if (theaterNameParam) params.set("theater_name", theaterNameParam);
    if (hallIdParam) params.set("hall_id", hallIdParam);
    if (hallNameParam) params.set("hall_name", hallNameParam);
    const q = params.toString();
    return `/movies/${movieId}${q ? `?${q}` : ""}`;
  };

  const bookingNavState = {
    theaterId: theaterIdParam,
    theaterName: theaterNameParam,
    hallId: hallIdParam,
    hallName: hallNameParam,
  };

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
      description: "A poignant Sri Lankan cinema drama depicting love, resilience, and personal triumph across tea estates."
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
      genre: "Biography / Drama / Thriller",
      language: "English",
      duration_min: 180,
      rating: "R",
      poster_url: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800",
      description: "The story of American scientist J. Robert Oppenheimer and his role in the Manhattan Project."
    },
    {
      movie_id: 6,
      title: "Inside Out 2",
      genre: "Animation / Family",
      language: "English",
      duration_min: 96,
      rating: "PG",
      poster_url: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=800",
      description: "Teenager Riley experiences new emotions as Anxiety, Envy, Ennui, and Embarrassment enter headquarters."
    },
    {
      movie_id: 7,
      title: "Leo: Bloody Sweet",
      genre: "Action / Thriller",
      language: "Tamil",
      duration_min: 164,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800",
      description: "A mild-mannered cafe owner defends his family against lethal cartel gangsters seeking revenge."
    },
    {
      movie_id: 8,
      title: "Kathuru Mithuru",
      genre: "Comedy / Family",
      language: "Sinhala",
      duration_min: 128,
      rating: "U",
      poster_url: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?q=80&w=800",
      description: "A classic Sri Lankan comedy recounting the humorous bond between an eccentric tailor and barber."
    },
    {
      movie_id: 9,
      title: "Spider-Man: Across the Spider-Verse",
      genre: "Animation / Action / Sci-Fi",
      language: "English",
      duration_min: 140,
      rating: "PG",
      poster_url: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=800",
      description: "Miles Morales catapults across the Multiverse to protect its existence alongside Spider-People."
    },
    {
      movie_id: 10,
      title: "Deadpool & Wolverine",
      genre: "Action / Comedy",
      language: "English",
      duration_min: 128,
      rating: "R",
      poster_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800",
      description: "Wolverine joins forces with Deadpool on a chaotic multiverse mission to save their timeline."
    },
    {
      movie_id: 11,
      title: "A Quiet Place: Day One",
      genre: "Thriller / Horror / Sci-Fi",
      language: "English",
      duration_min: 100,
      rating: "PG-13",
      poster_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800",
      description: "The terrifying first hours as sound-hunting alien predators suddenly descend upon New York City."
    },
    {
      movie_id: 12,
      title: "Anyone But You",
      genre: "Romance / Comedy",
      language: "English",
      duration_min: 103,
      rating: "R",
      poster_url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800",
      description: "Two polar opposites pretend to be an affectionate couple at an unforgettable Sydney destination wedding."
    },
    {
      movie_id: 13,
      title: "Stree 2",
      genre: "Comedy / Horror",
      language: "Hindi",
      duration_min: 147,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=800",
      description: "The town of Chanderi is haunted once again by a headless entity known as Sarkata."
    },
    {
      movie_id: 14,
      title: "Devara: Part 1",
      genre: "Action / Drama / Epic",
      language: "Tamil / Telugu",
      duration_min: 172,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800",
      description: "An epic tale set in coastal lands where a fearless man protects his people from dangerous smuggling syndicates."
    },
    {
      movie_id: 15,
      title: "Sinhabahu",
      genre: "Historical / Drama",
      language: "Sinhala",
      duration_min: 130,
      rating: "U",
      poster_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800",
      description: "The epic legendary saga of Prince Sinhabahu and the origins of Sri Lanka's historic lineage."
    },
    {
      movie_id: 16,
      title: "Joker: Folie à Deux",
      genre: "Crime / Drama / Musical",
      language: "English",
      duration_min: 138,
      rating: "R",
      poster_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800",
      description: "Arthur Fleck navigates his fractured mind and dual identity while finding dark romance within Arkham."
    },
    {
      movie_id: 17,
      title: "Kanguva",
      genre: "Action / Fantasy / Epic",
      language: "Tamil",
      duration_min: 154,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
      description: "A warrior's battle for tribal independence across ancient centuries echoes into a modern operative's destiny."
    },
    {
      movie_id: 18,
      title: "Gladiator II",
      genre: "Action / History / Epic",
      language: "English",
      duration_min: 150,
      rating: "R",
      poster_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800",
      description: "Lucius enters the legendary Colosseum years after Maximus's sacrifice to overthrow emperor tyranny."
    },
    {
      movie_id: 19,
      title: "Interstellar: 10th Anniversary IMAX",
      genre: "Sci-Fi / Drama",
      language: "English",
      duration_min: 169,
      rating: "PG-13",
      poster_url: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800",
      description: "Christopher Nolan's landmark sci-fi space odyssey returns to IMAX screens with remastered audio."
    },
    {
      movie_id: 20,
      title: "Gajaman",
      genre: "Animation / Comedy",
      language: "Sinhala",
      duration_min: 105,
      rating: "U",
      poster_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800",
      description: "Sri Lanka's landmark 3D animated comedy blockbuster bringing Camillus Perera's iconic characters to life."
    },
    {
      movie_id: 21,
      title: "Pravegaya",
      genre: "Action / Thriller",
      language: "Sinhala",
      duration_min: 142,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800",
      description: "A high-octane Sinhala action thriller following a young man entangled in an underworld pursuit."
    },
    {
      movie_id: 22,
      title: "Dharmayuddhaya",
      genre: "Thriller / Drama / Crime",
      language: "Sinhala",
      duration_min: 155,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800",
      description: "A gripping suspense drama about a devoted father who goes to extraordinary lengths to protect his family."
    },
    {
      movie_id: 23,
      title: "Maya 3D",
      genre: "Horror / Comedy",
      language: "Sinhala",
      duration_min: 130,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=800",
      description: "A riotous 3D horror comedy following an innocent youth possessed by a flamboyant spirit."
    },
    {
      movie_id: 24,
      title: "Vikram",
      genre: "Action / Thriller / Crime",
      language: "Tamil",
      duration_min: 174,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800",
      description: "A high-octane Tamil action thriller starring Kamal Haasan as a black-ops squad leader."
    },
    {
      movie_id: 25,
      title: "Demonte Colony 2",
      genre: "Horror / Thriller",
      language: "Tamil",
      duration_min: 140,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800",
      description: "A spine-chilling supernatural Tamil thriller unraveling dark cursed secrets within a haunted mansion."
    },
    {
      movie_id: 26,
      title: "Jailer",
      genre: "Action / Comedy",
      language: "Tamil",
      duration_min: 168,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800",
      description: "Superstar Rajinikanth stars as a retired jailer who unleashes his past to defend his family."
    },
    {
      movie_id: 27,
      title: "Kochadaiiyaan",
      genre: "Animation / Action / Epic",
      language: "Tamil",
      duration_min: 118,
      rating: "U",
      poster_url: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=800",
      description: "A groundbreaking Tamil 3D photorealistic motion-capture epic following a valiant warrior."
    },
    {
      movie_id: 28,
      title: "Jawan",
      genre: "Action / Thriller",
      language: "Hindi",
      duration_min: 169,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800",
      description: "Shah Rukh Khan in a gripping action spectacle driven by a personal vendetta to right wrongs."
    },
    {
      movie_id: 29,
      title: "Kalki 2898 AD",
      genre: "Sci-Fi / Action",
      language: "Hindi",
      duration_min: 181,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
      description: "A futuristic post-apocalyptic mythological sci-fi adventure blending the Mahabharata with dystopian 2898 AD."
    },
    {
      movie_id: 30,
      title: "Ramayana: The Legend of Prince Rama",
      genre: "Animation / Action / Epic",
      language: "Hindi",
      duration_min: 135,
      rating: "U",
      poster_url: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=800",
      description: "The critically acclaimed animated epic masterpiece depicting Prince Rama's righteous quest."
    },
    {
      movie_id: 31,
      title: "Rocky Aur Rani Kii Prem Kahaani",
      genre: "Romance / Comedy / Family / Drama",
      language: "Hindi",
      duration_min: 168,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800",
      description: "A vibrant Bollywood romantic family comedy exploring cultural opposites bridging differences."
    },
    {
      movie_id: 32,
      title: "The Wild Robot",
      genre: "Animation / Sci-Fi / Family",
      language: "English",
      duration_min: 102,
      rating: "PG",
      poster_url: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=800",
      description: "An intelligent robot shipwrecked on an island builds heartwarming bonds with the local wildlife."
    },
    {
      movie_id: 33,
      title: "96",
      genre: "Romance / Drama",
      language: "Tamil",
      duration_min: 158,
      rating: "U",
      poster_url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800",
      description: "Two high school sweethearts meet after 22 years at a school reunion and reminisce about their unforgettable past."
    },
    {
      movie_id: 34,
      title: "12th Fail",
      genre: "Drama / Biography",
      language: "Hindi",
      duration_min: 147,
      rating: "U",
      poster_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800",
      description: "The real-life story of IPS Officer Manoj Kumar Sharma, who braved poverty to restart his life and crack UPSC."
    },
    {
      movie_id: 35,
      title: "Nino Live",
      genre: "Sci-Fi / Drama / Comedy",
      language: "Sinhala",
      duration_min: 130,
      rating: "U/A",
      poster_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800",
      description: "A groundbreaking Sri Lankan film depicting a boy whose life is secretly filmed and broadcasted as a 24/7 reality show."
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
  const genres = ["All", "Action", "Romance", "Sci-Fi", "Thriller", "Comedy", "Drama", "Animation", "Horror"];

  const getLanguageCount = (lang) => {
    if (lang === "All") return movies.length;
    return movies.filter((m) => m.language?.toLowerCase().includes(lang.toLowerCase())).length;
  };

  const getGenreCount = (genre) => {
    if (genre === "All") return movies.length;
    return movies.filter((m) => m.genre?.toLowerCase().includes(genre.toLowerCase())).length;
  };

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch =
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.language.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLang = selectedLanguage === "All" || movie.language.toLowerCase().includes(selectedLanguage.toLowerCase());
    const matchesGenre = selectedGenre === "All" || movie.genre.toLowerCase().includes(selectedGenre.toLowerCase());

    return matchesSearch && matchesLang && matchesGenre;
  });

  const recommendedMovies = movies.filter((m) => {
    if (selectedLanguage !== "All" && m.language?.toLowerCase().includes(selectedLanguage.toLowerCase())) return true;
    if (selectedGenre !== "All" && m.genre?.toLowerCase().includes(selectedGenre.toLowerCase())) return true;
    return false;
  }).slice(0, 4);

  const fallbackRecommended = recommendedMovies.length > 0 ? recommendedMovies : movies.slice(0, 4);

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
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
              Now Showing Movies
            </h1>
            <p className="text-slate-300 text-base md:text-lg mt-2">
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
              className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500 rounded-2xl pl-12 pr-10 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none transition-all shadow-lg shadow-black/40"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchParams({});
                }}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Language & Genre Filters */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          {/* Language Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm sm:text-base font-extrabold text-slate-300 uppercase tracking-wider mr-2 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-rose-500" /> Language:
            </span>
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-4 py-2 rounded-full text-sm sm:text-base font-bold transition-all flex items-center gap-1.5 ${
                  selectedLanguage === lang
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                    : "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span>{lang}</span>
                {movies.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedLanguage === lang ? "bg-rose-700 text-white" : "bg-slate-800 text-slate-400"}`}>
                    {getLanguageCount(lang)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Genre Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm sm:text-base font-extrabold text-slate-300 uppercase tracking-wider mr-2">Genre:</span>
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-full text-sm sm:text-base font-bold transition-all flex items-center gap-1.5 ${
                  selectedGenre === genre
                    ? "bg-slate-800 text-rose-400 border border-rose-500/40"
                    : "bg-slate-900/50 border border-slate-800/80 text-slate-300 hover:text-slate-100"
                }`}
              >
                <span>{genre}</span>
                {genre !== "All" && movies.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedGenre === genre ? "bg-rose-500/20 text-rose-300" : "bg-slate-800 text-slate-400"}`}>
                    {getGenreCount(genre)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="max-w-7xl mx-auto">
        {/* Selected Cinema Filter Banner */}
        {theaterNameParam && (
          <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-600/30 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                  Selected Cinema Location
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {theaterNameParam} {hallNameParam ? `• ${hallNameParam}` : ""}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Movie tickets will be scheduled for this specific theater.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const nextParams = new URLSearchParams(searchParams);
                nextParams.delete("theater_id");
                nextParams.delete("theater_name");
                nextParams.delete("hall_id");
                nextParams.delete("hall_name");
                setSearchParams(nextParams);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <X className="w-4 h-4" /> Clear Cinema Filter
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="space-y-12">
            <div className="text-center py-12 px-6 bg-slate-900/70 rounded-3xl border border-slate-800 shadow-2xl max-w-3xl mx-auto">
              <Film className="w-16 h-16 text-rose-500/70 mx-auto mb-4" />
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
                {searchQuery
                  ? `No Movies Matching "${searchQuery}"`
                  : `No Titles Found in "${selectedLanguage} — ${selectedGenre}"`}
              </h3>
              <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto mb-6">
                {selectedLanguage !== "All" && selectedGenre !== "All"
                  ? `We didn't find ${selectedGenre} titles under ${selectedLanguage}. Explore other popular ${selectedLanguage} films or clear filters below:`
                  : "Try choosing another category or clearing your current search filters."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {selectedLanguage !== "All" && (
                  <button
                    onClick={() => setSelectedGenre("All")}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl text-sm transition-all"
                  >
                    View All {selectedLanguage} Movies
                  </button>
                )}
                {selectedGenre !== "All" && (
                  <button
                    onClick={() => setSelectedLanguage("All")}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl text-sm transition-all"
                  >
                    View All {selectedGenre} Movies
                  </button>
                )}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedLanguage("All");
                    setSelectedGenre("All");
                    setSearchParams({});
                  }}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-rose-600/30"
                >
                  Reset All Filters
                </button>
              </div>
            </div>

            {/* Recommended Alternatives Grid */}
            <div>
              <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3">
                <h4 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" /> Recommended Blockbusters You Might Like
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {fallbackRecommended.map((movie) => (
                  <div
                    key={movie.movie_id}
                    className="group relative bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-rose-950/30 flex flex-col justify-between"
                  >
                    <div className="relative aspect-[2/3] overflow-hidden bg-slate-950">
                      <img
                        src={movie.poster_url || FALLBACK_POSTER}
                        alt={movie.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_POSTER;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-3 py-1 bg-rose-600/90 text-white text-xs sm:text-sm font-extrabold rounded-md uppercase shadow">
                          {movie.rating || "U/A"}
                        </span>
                        <span className="px-3 py-1 bg-slate-950/90 text-slate-200 text-xs sm:text-sm font-extrabold rounded-md border border-slate-800 uppercase shadow">
                          {movie.language}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-rose-400 mb-1.5 uppercase tracking-wide">
                          {movie.genre}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white mb-2 line-clamp-1 group-hover:text-rose-400 transition-colors">
                          {movie.title}
                        </h3>
                        <p className="text-slate-200 text-sm sm:text-base line-clamp-2 mb-4 leading-relaxed font-normal">
                          {movie.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-base text-slate-300 font-mono font-medium">
                          {movie.duration_min} mins
                        </div>
                        <Link
                          to={buildMovieBookingUrl(movie.movie_id)}
                          state={bookingNavState}
                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-md shadow-rose-600/20 transition-all hover:scale-105"
                        >
                          Book Tickets &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                    src={movie.poster_url || FALLBACK_POSTER}
                    alt={movie.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_POSTER;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Rating & Language Badge */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-3 py-1 bg-rose-600/90 text-white text-xs sm:text-sm font-extrabold rounded-md uppercase shadow">
                      {movie.rating || "U/A"}
                    </span>
                    <span className="px-3 py-1 bg-slate-950/90 text-slate-200 text-xs sm:text-sm font-extrabold rounded-md border border-slate-800 uppercase shadow">
                      {movie.language}
                    </span>
                  </div>
                </div>

                {/* Info Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-sm font-extrabold text-rose-400 mb-1.5 uppercase tracking-wide">
                      {movie.genre}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white mb-2 line-clamp-1 group-hover:text-rose-400 transition-colors">
                      {movie.title}
                    </h3>
                    <p className="text-slate-200 text-sm sm:text-base line-clamp-2 mb-4 leading-relaxed font-normal">
                      {movie.description}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="text-base text-slate-300 font-mono font-medium">
                      {movie.duration_min} mins
                    </div>
                    <Link
                      to={buildMovieBookingUrl(movie.movie_id)}
                      state={bookingNavState}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-md shadow-rose-600/20 transition-all hover:scale-105"
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
