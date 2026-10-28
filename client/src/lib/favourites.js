// Utilities for managing user Favourite Movies with localStorage & cross-tab synchronization

const FAVOURITES_KEY = "quickshow_favourites";

export const getFavourites = () => {
  try {
    const raw = localStorage.getItem(FAVOURITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to parse favourites from localStorage:", err);
    return [];
  }
};

export const getMovieIdentifier = (movie) => {
  if (!movie) return null;
  return String(movie.movie_id || movie.id || movie._id || "");
};

export const isMovieFavourite = (movieOrId) => {
  if (!movieOrId) return false;
  const targetId = typeof movieOrId === "object" ? getMovieIdentifier(movieOrId) : String(movieOrId);
  if (!targetId) return false;

  const current = getFavourites();
  return current.some((m) => getMovieIdentifier(m) === targetId);
};

export const addFavourite = (movie) => {
  if (!movie) return false;
  const targetId = getMovieIdentifier(movie);
  if (!targetId) return false;

  const current = getFavourites();
  const exists = current.some((m) => getMovieIdentifier(m) === targetId);

  if (!exists) {
    const normalizedMovie = {
      id: movie.id || movie.movie_id || movie._id || targetId,
      movie_id: movie.movie_id || movie.id || movie._id || targetId,
      _id: movie._id || movie.id || movie.movie_id || targetId,
      title: movie.title || "Cinema Movie",
      overview: movie.overview || movie.description || "Exciting cinema screening now in theaters.",
      poster_path: movie.poster_path || movie.poster_url || "",
      poster_url: movie.poster_url || movie.poster_path || "",
      backdrop_path: movie.backdrop_path || movie.poster_url || movie.poster_path || "",
      vote_average: movie.vote_average || movie.rating || 8.5,
      runtime: movie.runtime || movie.duration_min || 150,
      duration_min: movie.duration_min || movie.runtime || 150,
      release_date: movie.release_date || "2024",
      genres: movie.genres || [{ name: movie.genre || "Action" }],
      genre: movie.genre || (movie.genres?.[0]?.name) || "Action",
      casts: movie.casts || []
    };

    const updated = [normalizedMovie, ...current];
    try {
      localStorage.setItem(FAVOURITES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("favouritesUpdated"));
      return true;
    } catch (err) {
      console.error("Failed to save favourite to localStorage:", err);
      return false;
    }
  }
  return true;
};

export const removeFavourite = (movieOrId) => {
  if (!movieOrId) return false;
  const targetId = typeof movieOrId === "object" ? getMovieIdentifier(movieOrId) : String(movieOrId);
  if (!targetId) return false;

  const current = getFavourites();
  const updated = current.filter((m) => getMovieIdentifier(m) !== targetId);

  try {
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("favouritesUpdated"));
    return true;
  } catch (err) {
    console.error("Failed to remove favourite from localStorage:", err);
    return false;
  }
};

export const toggleFavourite = (movie) => {
  if (isMovieFavourite(movie)) {
    removeFavourite(movie);
    return false;
  } else {
    addFavourite(movie);
    return true;
  }
};

export const clearAllFavourites = () => {
  try {
    localStorage.removeItem(FAVOURITES_KEY);
    window.dispatchEvent(new Event("favouritesUpdated"));
    return true;
  } catch (err) {
    console.error("Failed to clear favourites from localStorage:", err);
    return false;
  }
};
