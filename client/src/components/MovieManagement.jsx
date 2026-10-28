import React, { useState, useEffect, useMemo } from "react";
import {
  Film,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Clock,
  Calendar,
  Globe,
  Star,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Image as ImageIcon,
  Sparkles,
  ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";

const DEFAULT_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600";

const MovieManagement = ({ adminToken, apiBaseUrl = "http://localhost:8000/api", onMoviesUpdated }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search, filter, and sort state
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [sortBy, setSortBy] = useState("release_date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation modal state
  const [movieToDelete, setMovieToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    title: "",
    genre: "Action",
    synopsis: "",
    release_date: new Date().toISOString().split("T")[0],
    duration: 120,
    language: "English",
    poster_url: "",
    rating: "PG-13",
    status: "Now Showing"
  });

  // Fetch movies with admin endpoint
  const fetchMovies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (selectedGenre !== "all") params.append("genre", selectedGenre);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedLanguage !== "all") params.append("language", selectedLanguage);
      if (sortBy) params.append("sort_by", sortBy);
      if (sortOrder) params.append("sort_order", sortOrder);

      const url = `${apiBaseUrl}/admin/movies?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setMovies(data);
        if (onMoviesUpdated) onMoviesUpdated(data);
      } else {
        // Fallback to public movies endpoint if admin endpoint returns error
        const pubRes = await fetch(`${apiBaseUrl}/movies`);
        if (pubRes.ok) {
          const pubData = await pubRes.json();
          setMovies(pubData);
        }
      }
    } catch (err) {
      console.error("Failed to fetch movies:", err);
      toast.error("Failed to load movies feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [search, selectedGenre, selectedStatus, selectedLanguage, sortBy, sortOrder]);

  // Handle open Add Modal
  const openCreateModal = () => {
    setModalMode("create");
    setEditingMovieId(null);
    setFormData({
      title: "",
      genre: "Action",
      synopsis: "",
      release_date: new Date().toISOString().split("T")[0],
      duration: 120,
      language: "English",
      poster_url: "",
      rating: "PG-13",
      status: "Now Showing"
    });
    setIsModalOpen(true);
  };

  // Handle open Edit Modal
  const openEditModal = (movie) => {
    setModalMode("edit");
    setEditingMovieId(movie.movie_id);
    setFormData({
      title: movie.title || "",
      genre: movie.genre || "Action",
      synopsis: movie.description || movie.synopsis || "",
      release_date: movie.release_date || new Date().toISOString().split("T")[0],
      duration: movie.duration_min || movie.duration || 120,
      language: movie.language || "English",
      poster_url: movie.poster_url || "",
      rating: movie.rating || "PG-13",
      status: movie.status || "Now Showing"
    });
    setIsModalOpen(true);
  };

  // Form submit handler (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Movie title is required");
      return;
    }
    if (!formData.duration || formData.duration <= 0) {
      toast.error("Please provide a valid duration in minutes");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title: formData.title.trim(),
      genre: formData.genre.trim(),
      synopsis: formData.synopsis.trim(),
      description: formData.synopsis.trim(),
      release_date: formData.release_date || null,
      duration: parseInt(formData.duration, 10),
      duration_min: parseInt(formData.duration, 10),
      language: formData.language.trim(),
      poster_url: formData.poster_url.trim() || null,
      rating: formData.rating,
      status: formData.status
    };

    try {
      if (modalMode === "create") {
        const res = await fetch(`${apiBaseUrl}/admin/movies`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const created = await res.json();
          toast.success(`Movie '${created.title}' added successfully!`, {
            icon: "🎬"
          });
          setIsModalOpen(false);
          fetchMovies();
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.detail || "Failed to create movie record");
        }
      } else {
        // Edit mode
        const res = await fetch(`${apiBaseUrl}/admin/movies/${editingMovieId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const updated = await res.json();
          toast.success(`Movie '${updated.title}' updated successfully!`, {
            icon: "✨"
          });
          setIsModalOpen(false);
          fetchMovies();
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.detail || "Failed to update movie");
        }
      }
    } catch (err) {
      toast.error(err.message || "Network request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete movie handler with safe foreign key cascade
  const handleConfirmDelete = async () => {
    if (!movieToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`${apiBaseUrl}/admin/movies/${movieToDelete.movie_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      if (res.ok || res.status === 204) {
        toast.success(`Movie '${movieToDelete.title}' and associated showtimes safely deleted!`, {
          icon: "🗑️"
        });
        setMovieToDelete(null);
        fetchMovies();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.detail || "Failed to delete movie");
      }
    } catch (err) {
      toast.error(err.message || "Network error deleting movie");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper stats
  const totalCount = movies.length;
  const nowShowingCount = useMemo(() => movies.filter((m) => m.status === "Now Showing").length, [movies]);
  const comingSoonCount = useMemo(() => movies.filter((m) => m.status === "Coming Soon").length, [movies]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold mb-2 border border-rose-500/20">
              <Film className="w-3.5 h-3.5" /> Cinema Catalog Management
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Movie Repertoire & Schedule Control
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Create, update, and manage all cinema listings. Changes update the public schedule and booking engine in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchMovies}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-2 text-sm font-semibold"
              title="Refresh Catalog"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-500" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={openCreateModal}
              className="px-5 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> Add New Movie
            </button>
          </div>
        </div>

        {/* Catalog KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Movies</span>
            <div className="text-2xl font-black text-white">{totalCount}</div>
          </div>
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">Now Showing</span>
            <div className="text-2xl font-black text-emerald-400">{nowShowingCount}</div>
          </div>
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 col-span-2 sm:col-span-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">Coming Soon</span>
            <div className="text-2xl font-black text-amber-400">{comingSoonCount}</div>
          </div>
        </div>
      </div>

      {/* Search, Filter, and Sort Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, genre, synopsis, language..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors placeholder:text-slate-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-rose-500 appearance-none pr-8 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Now Showing">Now Showing</option>
              <option value="Coming Soon">Coming Soon</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Genre Filter */}
          <div className="relative min-w-[130px]">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-rose-500 appearance-none pr-8 cursor-pointer"
            >
              <option value="all">All Genres</option>
              <option value="Action">Action</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Drama">Drama</option>
              <option value="Romance">Romance</option>
              <option value="Thriller">Thriller</option>
              <option value="Comedy">Comedy</option>
              <option value="Animation">Animation</option>
              <option value="Horror">Horror</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort By */}
          <div className="relative min-w-[150px]">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-");
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-rose-500 appearance-none pr-8 cursor-pointer"
            >
              <option value="release_date-desc">Release Date (Newest)</option>
              <option value="release_date-asc">Release Date (Oldest)</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
              <option value="duration_min-desc">Duration (Longest)</option>
              <option value="duration_min-asc">Duration (Shortest)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Movie Interactive Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Poster & Movie Title</th>
                <th className="py-3 px-4">Genre</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Release Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Showtimes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {movies.length > 0 ? (
                movies.map((movie) => {
                  const durationMin = movie.duration_min || movie.duration || 120;
                  const hours = Math.floor(durationMin / 60);
                  const mins = durationMin % 60;
                  const durationStr = `${hours}h ${mins}m`;
                  const isNowShowing = movie.status === "Now Showing";

                  return (
                    <tr key={movie.movie_id} className="hover:bg-slate-800/40 transition-colors group">
                      {/* Movie Thumbnail + Title + Rating */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3.5 min-w-[240px]">
                          <div className="w-12 h-16 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 shadow">
                            <img
                              src={movie.poster_url || DEFAULT_POSTER}
                              alt={movie.title}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = DEFAULT_POSTER;
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-white text-base leading-snug group-hover:text-rose-400 transition-colors">
                              {movie.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {movie.rating || "PG-13"}
                              </span>
                              <span className="text-xs text-slate-400 truncate max-w-[160px]" title={movie.synopsis || movie.description}>
                                {movie.synopsis || movie.description || "No synopsis available"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Genre */}
                      <td className="py-4 px-4 text-slate-300 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-300">
                          {movie.genre}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-4 font-mono text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{durationStr}</span>
                          <span className="text-slate-500">({durationMin}m)</span>
                        </div>
                      </td>

                      {/* Language */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          {movie.language}
                        </div>
                      </td>

                      {/* Release Date */}
                      <td className="py-4 px-4 font-mono text-xs text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {movie.release_date || "TBD"}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            isNowShowing
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isNowShowing ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                          {movie.status}
                        </span>
                      </td>

                      {/* Showtimes Count */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-950 border border-slate-800 text-slate-300">
                          {movie.showtimes_count ?? movie.showtimes?.length ?? 0} slots
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(movie)}
                            className="p-2 text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer"
                            title="Edit Movie"
                          >
                            <Edit3 className="w-4 h-4 text-sky-400" />
                          </button>

                          <button
                            onClick={() => setMovieToDelete(movie)}
                            className="p-2 text-slate-300 hover:text-rose-400 bg-slate-950 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 rounded-xl transition-all cursor-pointer"
                            title="Delete Movie"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <Film className="w-12 h-12 text-slate-600 mb-3" />
                      <p className="text-base font-semibold text-white">No Movies Found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {search || selectedGenre !== "all" || selectedStatus !== "all"
                          ? "Try adjusting your search criteria or clearing filters."
                          : "Start building your cinema schedule by adding your first movie."}
                      </p>
                      <button
                        onClick={openCreateModal}
                        className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        + Add Movie Now
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE & EDIT MOVIE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                {modalMode === "create" ? <Plus className="w-6 h-6" /> : <Edit3 className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {modalMode === "create" ? "Add New Movie" : `Edit Movie: ${formData.title || "Movie"}`}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  {modalMode === "create"
                    ? "Enter movie details to add to catalog and schedule showtimes."
                    : "Update cinema information and metadata."}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Title & Genre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Movie Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Avatar: Fire and Ash"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Genre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    placeholder="e.g. Sci-Fi, Action, Adventure"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Synopsis / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Synopsis / Storyline
                </label>
                <textarea
                  rows="3"
                  value={formData.synopsis}
                  onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                  placeholder="Provide a compelling synopsis of the movie plot..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors resize-none"
                ></textarea>
              </div>

              {/* Duration, Language, Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="150"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Language *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    placeholder="English / Sinhala / Tamil"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Age Rating
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  >
                    <option value="G">G - General Audiences</option>
                    <option value="PG">PG - Parental Guidance</option>
                    <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                    <option value="R">R - Restricted (17+)</option>
                    <option value="NC-17">NC-17 - Adults Only</option>
                    <option value="18+">18+ Only</option>
                  </select>
                </div>
              </div>

              {/* Release Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Release Date
                  </label>
                  <input
                    type="date"
                    value={formData.release_date}
                    onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Display Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  >
                    <option value="Now Showing">Now Showing (Active in Theaters)</option>
                    <option value="Coming Soon">Coming Soon (Upcoming Premiere)</option>
                  </select>
                </div>
              </div>

              {/* Poster URL with Live Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Poster Image URL
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="url"
                    value={formData.poster_url}
                    onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                    placeholder="https://images.unsplash.com/... or hosted poster link"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                  />
                  {formData.poster_url && (
                    <div className="w-12 h-14 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 shadow">
                      <img
                        src={formData.poster_url}
                        alt="Preview"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_POSTER;
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Leave empty to use high-resolution cinema backdrop default.
                </p>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving Movie...</span>
                    </>
                  ) : modalMode === "create" ? (
                    <>
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Create Movie</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION POPUP MODAL */}
      {movieToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-white text-center mb-1">
              Confirm Movie Deletion
            </h3>
            <p className="text-slate-300 text-sm text-center mb-4">
              Are you sure you want to delete <strong className="text-white">"{movieToDelete.title}"</strong>?
            </p>

            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 mb-6 flex items-center gap-3">
              <div className="w-12 h-16 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                <img
                  src={movieToDelete.poster_url || DEFAULT_POSTER}
                  alt={movieToDelete.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_POSTER;
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left text-xs text-slate-400">
                <div className="font-bold text-white text-sm truncate">{movieToDelete.title}</div>
                <div>{movieToDelete.genre} • {movieToDelete.duration_min || movieToDelete.duration} mins</div>
                <div className="text-rose-400 mt-1 font-medium">
                  Safely cleans up attached showtime schedules & bookings.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMovieToDelete(null)}
                className="flex-1 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Confirm Delete
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

export default MovieManagement;
