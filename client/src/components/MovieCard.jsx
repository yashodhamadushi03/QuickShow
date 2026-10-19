import { StarIcon } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import timeFormat from '../lib/timeFormat';

const MovieCard = ({movie}) => {

    const navigate= useNavigate();

    return (

        <div className='flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition-y-1 transition duration-300 w-66'>
          <img onClick={()=> {navigate(`/movies/${movie.id}`); scrollTo(0,0)}}
            src={movie.backdrop_path}
            alt=""
            className="rounded-lg h-52 w-full object-cover object-bottom-right cursor-pointer"
          />

          <p className='font-bold text-base mt-2 truncate text-white'>{movie.title}</p>
          <p className='text-sm text-slate-300 mt-2 leading-relaxed'>
            {new Date(movie.release_date).getFullYear()} &bull; {movie.genres?.slice(0,2).map
            (genre => genre.name).join(" | ")} &bull; {timeFormat(movie.runtime)}
          </p>

          <div className='flex items-center justify-between mt-4 pb-3'>

            <button onClick={()=> {navigate(`/movies/${movie.id}`); scrollTo(0,0)}}
            className='px-4 py-2 text-sm bg-primary hover:bg-primary-dull
            transition rounded-full font-semibold cursor-pointer text-white'>Buy Tickets</button>

            <p className='flex items-center gap-1 text-sm font-semibold text-slate-200 mt-1 pr-1'>
                <StarIcon className='w-4 h-4 text-primary fill-primary'/>
                {movie.vote_average.toFixed(1)}
            </p>
          </div>
        </div>
    )
}

export default MovieCard