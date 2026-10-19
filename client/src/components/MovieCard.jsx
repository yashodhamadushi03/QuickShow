import { StarIcon } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import timeFormat from '../lib/timeFormat';
import { FALLBACK_BACKDROP } from '../assets/assets';

const MovieCard = ({movie}) => {

    const navigate = useNavigate();
    const posterSrc = movie.backdrop_path || movie.poster_url || movie.poster_path || FALLBACK_BACKDROP;

    return (

        <div className='flex flex-col justify-between p-3.5 bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-2xl hover:-translate-y-1.5 transition-all duration-300 w-full sm:w-66 shadow-lg shadow-black/40'>
          <div className="relative overflow-hidden rounded-xl bg-slate-950 aspect-[16/10]">
            <img 
              onClick={() => { navigate(`/movies/${movie.id || movie.movie_id}`); scrollTo(0,0); }}
              src={posterSrc}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_BACKDROP;
              }}
              alt={movie.title || "Movie Poster"}
              className="w-full h-full object-cover object-center cursor-pointer hover:scale-105 transition-transform duration-500"
            />
          </div>

          <p className='font-black text-base md:text-lg mt-3 truncate text-white'>{movie.title}</p>
          <p className='text-sm text-slate-300 mt-1.5 leading-relaxed line-clamp-1 font-medium'>
            {movie.release_date ? new Date(movie.release_date).getFullYear() : "2024"} &bull; {movie.genres?.slice(0,2).map
            (genre => genre.name || genre).join(" | ") || movie.genre || "Cinema"} &bull; {movie.runtime ? timeFormat(movie.runtime) : (movie.duration_min ? `${movie.duration_min}m` : "2h 15m")}
          </p>

          <div className='flex items-center justify-between mt-4 pb-1'>

            <button onClick={() => { navigate(`/movies/${movie.id || movie.movie_id}`); scrollTo(0,0); }}
            className='px-5 py-2 text-sm bg-rose-600 hover:bg-rose-500
            transition-all rounded-full font-extrabold cursor-pointer text-white shadow-md shadow-rose-600/30 hover:scale-105'>Buy Tickets</button>

            <p className='flex items-center gap-1.5 text-sm font-black text-white mt-1 pr-1'>
                <StarIcon className='w-4 h-4 text-rose-500 fill-rose-500'/>
                {movie.vote_average ? Number(movie.vote_average).toFixed(1) : (movie.rating || "8.5")}
            </p>
          </div>
        </div>
    )
}

export default MovieCard