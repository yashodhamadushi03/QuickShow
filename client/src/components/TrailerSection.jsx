import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import BlurCircle from './BlurCircle';
import { dummyTrailers } from '../assets/assets';
import { PlayCircleIcon } from 'lucide-react';

const TrailerSection = () => {
  const [currentTrailer, setCurrentTrailer] = useState(
    dummyTrailers?.[0] || null
  );
  console.log(currentTrailer);
console.log(currentTrailer?.videoUrl);

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden">
      <p className="text-gray-300 font-medium text-lg max-w-240 mx-auto">
        Trailers
      </p>

      <div className="relative mt-6">
        <BlurCircle top="-100px" right="-100px" />

        {currentTrailer ? (
          <ReactPlayer
  src={currentTrailer.videoUrl}
  controls
  width="100%"
  height="540px"
/>
        ) : (
          <p className="text-center text-gray-400">
            No trailer available
          </p>
        )}
      </div>
      <div className='group grid grid-cols-4 md:gap-8 max-w-3xl mx-auto'>
        {dummyTrailers.map((trailer)=> (
            <div key={trailer.image} className='relative
            group-hover:not:not-hover:opacity-50 hover:-translate-y-1 duration-300
            transition max-md:h-60 md:max-h-60 cursor-pointer' onClick={()=>
                setCurrentTrailer(trailer)}>


            
              <img src={trailer.image} alt="trailer" className='rounded-lg w-fullh 
              h-full object-cover brightness-75'/>
              <PlayCircleIcon strokeWidth={1.6}className="absolutr top-1/2
              left-1/2 w-5 md:w-8 h-5 md:h-12 transforms -translate-x-1/2
              -translate-y-1/2"/>
            </div>
        ))}

      </div>
    </div>
  );
};

export default TrailerSection;