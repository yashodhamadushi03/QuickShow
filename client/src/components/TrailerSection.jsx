import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import BlurCircle from './BlurCircle';
import { dummyTrailers, FALLBACK_BACKDROP } from '../assets/assets';
import { PlayCircleIcon } from 'lucide-react';

const TrailerSection = () => {
  const [currentTrailer, setCurrentTrailer] = useState(
    dummyTrailers?.[0] || null
  );

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden">
      <h2 className="text-white font-black text-3xl md:text-5xl max-w-240 mx-auto">
        Official Movie Trailers
      </h2>

      <div className="relative mt-6 max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
        <BlurCircle top="-100px" right="-100px" />

        {currentTrailer ? (
          <ReactPlayer
            src={currentTrailer.videoUrl}
            controls
            width="100%"
            height="480px"
          />
        ) : (
          <p className="text-center text-gray-400 py-16">
            No trailer available
          </p>
        )}
      </div>

      <div className='group grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mt-8'>
        {dummyTrailers.map((trailer) => (
          <div
            key={trailer.image}
            className='relative rounded-xl overflow-hidden group-hover:not:not-hover:opacity-50 hover:-translate-y-1.5 duration-300 transition h-32 sm:h-36 md:h-44 cursor-pointer border border-slate-800 hover:border-rose-500/60 shadow-lg'
            onClick={() => setCurrentTrailer(trailer)}
          >
            <img
              src={trailer.image}
              alt="trailer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_BACKDROP;
              }}
              className='rounded-xl w-full h-full object-cover brightness-75 hover:brightness-90 transition-all'
            />
            <PlayCircleIcon
              strokeWidth={1.8}
              className="absolute top-1/2 left-1/2 w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 transform -translate-x-1/2 -translate-y-1/2 text-white/90 drop-shadow-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrailerSection;