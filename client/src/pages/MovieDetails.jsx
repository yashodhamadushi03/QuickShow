import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { dummyShowsData, dummyDateTimeData, FALLBACK_POSTER, FALLBACK_AVATAR } from '../assets/assets';
import { StarIcon } from '@heroicons/react/24/solid';
import BlurCircle from '../components/BlurCircle';
import timeFormat  from "../lib/timeFormat";
import { Heart, PlayCircle } from 'lucide-react';
import DateSelect from '../components/DateSelect';
import MovieCard from '../components/MovieCard';
import toast from 'react-hot-toast';
import { isMovieFavourite, toggleFavourite } from '../lib/favourites';

const MovieDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { id } = useParams();

  const passedTheaterId = location.state?.theaterId || searchParams.get("theater_id");
  const passedTheaterName = location.state?.theaterName || searchParams.get("theater_name");
  const passedHallId = location.state?.hallId || searchParams.get("hall_id");
  const passedHallName = location.state?.hallName || searchParams.get("hall_name");

  const [theaters, setTheaters] = useState([]);
  const [show, setShow] = useState(null);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8000/api/theaters`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setTheaters(data);
      })
      .catch((e) => console.warn("Failed to load theaters in MovieDetails:", e));
  }, []);


  const getShow = async () => {
    // 1. Check in dummyShowsData
    let movie = dummyShowsData.find(
      (show) => String(show._id) === String(id) || String(show.id) === String(id)
    );

    // 2. If not in dummy data, try fetching from backend API
    if (!movie) {
      try {
        const res = await fetch(`http://localhost:8000/api/movies/${id}`);
        if (res.ok) {
          const apiMovie = await res.json();
          movie = {
            _id: String(apiMovie.movie_id),
            id: apiMovie.movie_id,
            title: apiMovie.title,
            overview: apiMovie.description,
            poster_path: apiMovie.poster_url || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800",
            backdrop_path: apiMovie.poster_url || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800",
            vote_average: 8.8,
            runtime: apiMovie.duration_min || 150,
            release_date: "2024-05-10",
            genres: [{ name: apiMovie.genre || "Action" }],
            casts: dummyShowsData[0].casts || []
          };
        }
      } catch (err) {
        console.warn("Backend movie fetch failed, using fallback:", err);
      }
    }

    // 3. Fallback to default movie if still not found
    if (!movie) {
      const fallback = dummyShowsData[0];
      movie = {
        ...fallback,
        _id: id,
        id: id,
      };
    }

    setShow({
      movie,
      dateTime: dummyDateTimeData,
    });
  };

  useEffect(() => {
    getShow();
    window.scrollTo(0, 0);
  }, [id]);

  const handleScrollToBooking = () => {
    const element = document.getElementById("dateSelect");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (show?.movie) {
      setIsFav(isMovieFavourite(show.movie));
    }
  }, [show]);

  useEffect(() => {
    const handleFavUpdate = () => {
      if (show?.movie) {
        setIsFav(isMovieFavourite(show.movie));
      }
    };
    window.addEventListener("favouritesUpdated", handleFavUpdate);
    window.addEventListener("storage", handleFavUpdate);
    return () => {
      window.removeEventListener("favouritesUpdated", handleFavUpdate);
      window.removeEventListener("storage", handleFavUpdate);
    };
  }, [show]);

  const handleToggleFavourite = () => {
    if (!show?.movie) return;
    const nowFav = toggleFavourite(show.movie);
    setIsFav(nowFav);
    if (nowFav) {
      toast.success(`"${show.movie.title}" added to Favourites!`, {
        icon: "❤️",
        style: { background: "#0f172a", color: "#fff", border: "1px solid #f43f5e" }
      });
    } else {
      toast(`"${show.movie.title}" removed from Favourites`, {
        icon: "💔",
        style: { background: "#0f172a", color: "#fca5a5", border: "1px solid #334155" }
      });
    }
  };

  return show ? (
    <div className="px-6 md:px-16 lg:px-40 pt-28 md:pt-36 pb-20">
      <div className="flex flex-col md:flex-row gap-10 max-w-6xl mx-auto">
        <img
          src={show.movie.poster_path || show.movie.poster_url || FALLBACK_POSTER}
          alt={show.movie.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_POSTER;
          }}
          className="max-md:mx-auto rounded-2xl h-112 max-w-80 object-cover shadow-2xl border border-slate-800"
        />
        <div className="relative flex flex-col gap-4 justify-center">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-rose-500 font-black tracking-widest text-sm sm:text-base uppercase">
            {show.movie.genres?.[0]?.name || "ENGLISH"} CINEMA
          </p>
          <h1 className="text-4xl md:text-6xl font-black max-w-2xl text-balance text-white leading-tight">
            {show.movie.title}
          </h1>
          <div className="flex items-center gap-2.5 text-slate-200 text-base sm:text-lg">
            <StarIcon className="w-6 h-6 text-rose-500 fill-rose-500" />
            <span className="font-extrabold text-white">{show.movie.vote_average?.toFixed(1) || "8.5"}</span> User Ratings
          </div>
          <p className="text-slate-200 mt-1 text-base sm:text-lg leading-relaxed max-w-2xl">
            {show.movie.overview}
          </p>
          <p className="text-slate-300 text-base font-mono font-medium">
            {timeFormat(show.movie.runtime)} &bull; {show.movie.genres?.map((g) => g.name).join(", ")} &bull; {show.movie.release_date?.split("-")[0] || "2024"}
          </p>

          {/* Action buttons: Watch Trailer, Buy Tickets, Heart */}
          <div className="flex items-center gap-4 mt-4">
            <button
              type="button"
              onClick={() => window.open("https://www.youtube.com/results?search_query=" + encodeURIComponent(show.movie.title + " trailer"), "_blank")}
              className="flex items-center gap-2 px-7 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-2xl text-white text-base font-bold transition-colors cursor-pointer border border-slate-700 hover:scale-105"
            >
              <PlayCircle size={20} className="text-rose-500" />
              Watch Trailer
            </button>
            <button
              type="button"
              onClick={handleScrollToBooking}
              className="px-9 py-3.5 bg-rose-600 hover:bg-rose-500 rounded-2xl text-white font-extrabold text-base sm:text-lg shadow-xl shadow-rose-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              Buy Tickets
            </button>
            <button
              type="button"
              onClick={handleToggleFavourite}
              title={isFav ? "Remove from Favourites" : "Add to Favourites"}
              className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 ${
                isFav
                  ? "bg-rose-500/20 border-2 border-rose-500 shadow-lg shadow-rose-500/40 text-rose-500"
                  : "bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-rose-400"
              }`}
            >
              <Heart
                size={22}
                className={`transition-all duration-300 ${
                  isFav
                    ? "text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] scale-110"
                    : "text-slate-400 hover:text-rose-400"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <p className="text-2xl sm:text-3xl font-black text-white mt-20 mb-6">Cast & Crew</p>
      <div className="overflow-x-auto no-scrollbar pb-4">
        <div className="flex items-center gap-5 w-max">
          {show.movie.casts?.slice(0, 12).map((cast, index) => (
            <div key={index} className="flex flex-col items-center text-center w-28">
              <img
                src={cast.profile_path || FALLBACK_AVATAR}
                alt={cast.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_AVATAR;
                }}
                className="rounded-full h-20 w-20 aspect-square object-cover border-2 border-slate-700 shadow-lg"
              />
              <p className="font-bold text-slate-200 text-sm sm:text-base mt-2.5 line-clamp-1">{cast.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Date & Showtime Selector */}
      <DateSelect
        dateTime={show.dateTime}
        id={id}
        movie={show.movie}
        initialTheaterId={passedTheaterId}
        initialTheaterName={passedTheaterName}
        initialHallId={passedHallId}
        initialHallName={passedHallName}
        theaters={theaters}
      />


      <p className="text-2xl sm:text-3xl font-black text-white mt-20 mb-6">
        You May Also Like
      </p>

      <div className="flex flex-wrap max-sm:justify-center gap-6">
        {dummyShowsData.slice(0, 4).map((movie, index) => (
          <MovieCard key={index} movie={movie} />
        ))}
      </div>

      <div className="flex justify-center mt-14">
        <button
          onClick={() => navigate("/movies")}
          className="px-12 py-4 text-base sm:text-lg bg-rose-600 hover:bg-rose-500 transition rounded-2xl font-black text-white shadow-xl shadow-rose-600/30 cursor-pointer hover:scale-105 active:scale-95"
        >
          Show More Movies
        </button>
      </div>
    </div>
  ) : (
    <div className="flex justify-center items-center min-h-screen bg-slate-950">
      <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default MovieDetails;
