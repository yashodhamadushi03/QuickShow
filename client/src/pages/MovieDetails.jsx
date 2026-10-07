import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dummyShowsData, dummyDateTimeData } from '../assets/assets';
import { StarIcon } from '@heroicons/react/24/solid';
import BlurCircle from '../components/BlurCircle';
import timeFormat  from "../lib/timeFormat";
import { Heart, PlayCircle } from 'lucide-react';
import DateSelect from '../components/DateSelect';
import MovieCard from '../components/MovieCard'

const MovieDetails = () => {

  const navigate = useNavigate()
  const {id} = useParams();
  const [show,setShow] = useState(null);

  const getShow = async () => {
  const movie = dummyShowsData.find(
    (show) => String(show._id) === String(id)
  );

  if (!movie) {
    console.log("Movie not found:", id);
    return;

  if(show){
    setShow({
      movie: show,
      dateTime: dummyDateTimeData
    })
  }
  }

  setShow({
    movie,
    dateTime: dummyDateTimeData,
  });
};
  useEffect(() => {
    getShow()
  },[id])

  return show? (
    <div className='px-6 md:px-16 lg:px-40 pt-30 md:pt-50'>
      <div className='flex flex-col md:flex-row gap-8 max-w-6xl mx-auto'>
        <img src={show.movie.poster_path} alt="" className='max-md:mx-auto rounded-xl h-104 max-w-70 object-cover'/>
        <div className='relative flex flex-col gap-3'>
          <BlurCircle top='-100px' left='-100px'/>
          <p className='text-primary'>ENGLISH</p>
          <h1 className='text-4xl font-semibold max-w-96 text-balance'>{show.movie.title}</h1>
          <div className='flex items-center gap-2 text-gray-300'>
            
            <StarIcon className="w-5 h-5 text-primary fill-primary"/>
            {show.movie.vote_average.toFixed(1)} User Ratings
          </div>
          <p className='text-gray-400 mt-2 text-sm leading-tight max-w-xl'>{show.movie.overview}</p>
          <p>
            {timeFormat (show.movie.runtime)} . {show.movie.genres.map(genre =>genre.name).join(", ")} . {show.movie.release_date.split("-")[0]}
          </p>



{/* movie details of watch tailer button , heart button , buy ticket button */}
  <div className='flex items-center gap-3'>
    <button className="flex items-center gap-2 px-6 py-3 bg-[#1E293B] rounded-lg text-white">
      <PlayCircle size={20}/>
      Watch Trailer
    </button>
    <a href = "#dateSelect " className='px-8 py-3 bg-red-500 rounded-lg text-white font-medium'>Buy Tickets</a>
    <button className='w-12 h-12 flex items-center justify-center bg-[#334155] rounded-full'>
      <Heart size={20} className="text-white"/>
       </button>
    </div>
  </div>
</div>


<p className='text-lg font-medium mt-20'> Your Favourite Cast</p>
<div className='overflow-x-auto no-scrollbar mt-8 pb-4'>
 <div className='flex items-center gap-4 w-max px-4'>
  {show.movie.casts.slice(0,12).map((cast,index)=>(
    <div key={index} className='flex flex-col items-center text-center'>
      <img src={cast.profile_path} alt="" className='rounded-full h-20
      md:h-20 aspect-square object-cover'/>
       <p className='font-medium text-xs mt-3'>{cast.name}</p>
      </div>
  ))}
 </div>
</div>

<DateSelect dateTime={show.dateTime} id={id}/>


<p className='text-lg font-medium mt-20 mb-8'>
  You May Also Like
</p>

<div className='flex flex-wrap max-sm:justify-center gap-8'>
      {dummyShowsData.slice(0,4).map((movie,index)=>(
        <MovieCard key={index} movie={movie}/>
      ))}
</div>

<div className='flex justify-center mt-20'>
  <button onClick={()=> navigate('/movies')} className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull
  transition rounded-md font-medium cursor-pointer'>Show more</button>

</div>

</div>




  ) : (
    <div>
      <h1>Movie Details</h1>
    </div>
    
  );
  <div>
    
  </div>
};

export default MovieDetails;
