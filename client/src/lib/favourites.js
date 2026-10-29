// Utilities for managing user Favourite Movies with strict per-user scoping & cross-tab synchronization

export const getActiveUserEmail = () => {
  try {
    return (localStorage.getItem("customer_email") || localStorage.getItem("user_email") || "").trim().toLowerCase();
  } catch {
    return "";
  }
};

export const getFavouritesStorageKey = (email) => {
  const targetEmail = (email || getActiveUserEmail()).trim().toLowerCase();
  return targetEmail ? `quickshow_favourites_${targetEmail}` : "quickshow_favourites_unauth";
};

export const getFavourites = (email) => {
  const activeEmail = (email || getActiveUserEmail()).trim().toLowerCase();
  if (!activeEmail) return [];
  try {
    const raw = localStorage.getItem(getFavouritesStorageKey(activeEmail));
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

export const isMovieFavourite = (movieOrId, email) => {
  if (!movieOrId) return false;
  const targetId = typeof movieOrId === "object" ? getMovieIdentifier(movieOrId) : String(movieOrId);
  if (!targetId) return false;

  const current = getFavourites(email);
  return current.some((m) => getMovieIdentifier(m) === targetId);
};

export const addFavourite = (movie, email) => {
  if (!movie) return false;
  const activeEmail = (email || getActiveUserEmail()).trim().toLowerCase();
  if (!activeEmail) return false; // Authentication required to favorite

  const targetId = getMovieIdentifier(movie);
  if (!targetId) return false;

  const current = getFavourites(activeEmail);
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
      localStorage.setItem(getFavouritesStorageKey(activeEmail), JSON.stringify(updated));
      window.dispatchEvent(new Event("favouritesUpdated"));

      // Asynchronously synchronize with MySQL backend database
      const token = localStorage.getItem("token") || "";
      const numericId = parseInt(targetId, 10);
      if (!isNaN(numericId)) {
        fetch("/api/favourites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ movie_id: numericId, email: activeEmail })
        }).catch((e) => console.debug("Sync favourite error:", e));
      }

      return true;
    } catch (err) {
      console.error("Failed to save favourite to localStorage:", err);
      return false;
    }
  }
  return true;
};

export const removeFavourite = (movieOrId, email) => {
  if (!movieOrId) return false;
  const activeEmail = (email || getActiveUserEmail()).trim().toLowerCase();
  if (!activeEmail) return false;

  const targetId = typeof movieOrId === "object" ? getMovieIdentifier(movieOrId) : String(movieOrId);
  if (!targetId) return false;

  const current = getFavourites(activeEmail);
  const updated = current.filter((m) => getMovieIdentifier(m) !== targetId);

  try {
    localStorage.setItem(getFavouritesStorageKey(activeEmail), JSON.stringify(updated));
    window.dispatchEvent(new Event("favouritesUpdated"));

    // Asynchronously synchronize removal with MySQL backend database
    const token = localStorage.getItem("token") || "";
    const numericId = parseInt(targetId, 10);
    if (!isNaN(numericId)) {
      const url = `/api/favourites/${numericId}?email=${encodeURIComponent(activeEmail)}`;
      fetch(url, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }).catch((e) => console.debug("Sync remove favourite error:", e));
    }

    return true;
  } catch (err) {
    console.error("Failed to remove favourite from localStorage:", err);
    return false;
  }
};

export const toggleFavourite = (movie, email) => {
  if (isMovieFavourite(movie, email)) {
    removeFavourite(movie, email);
    return false;
  } else {
    addFavourite(movie, email);
    return true;
  }
};

export const clearAllFavourites = async (email) => {
  const activeEmail = (email || getActiveUserEmail()).trim().toLowerCase();
  if (!activeEmail) return false;

  const current = getFavourites(activeEmail);
  try {
    localStorage.removeItem(getFavouritesStorageKey(activeEmail));
    window.dispatchEvent(new Event("favouritesUpdated"));

    const token = localStorage.getItem("token") || "";
    for (const m of current) {
      const numericId = parseInt(getMovieIdentifier(m), 10);
      if (!isNaN(numericId)) {
        fetch(`/api/favourites/${numericId}?email=${encodeURIComponent(activeEmail)}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }).catch(() => {});
      }
    }
    return true;
  } catch (err) {
    console.error("Failed to clear favourites from localStorage:", err);
    return false;
  }
};
