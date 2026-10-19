import { ArrowRight, Calendar1Icon, ClockIcon } from 'lucide-react';
import React from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';


const HeroSection = () => {

    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-start justify-center gap-4 
        px-6 md:px-16 lg:px-36 bg-[url('/backgroundImage.png')]
        bg-cover bg-center h-screen">

    <img src={assets.marvellogo} alt="" className ="max-h-11 lg:h-11 mt-20"/>

    <h1 className='text-5xl md:text-[70px] md:leading-18 font-semibold
        max-w-110'>Guardians <br/>of the Galaxy</h1>

        <div className='flex items-center gap-4 text-slate-200 text-sm sm:text-base font-medium'>
            <span>Action | Adventure | Sci-Fi</span>
            <div className = 'flex items-center gap-1.5'>
            <Calendar1Icon className='w-4.5 h-4.5 text-rose-500' /> 2018
            </div>

            <div className = 'flex items-center gap-1.5'>
            <ClockIcon className='w-4.5 h-4.5 text-rose-500' /> 2h 8m

            </div>
            
          </div>

          <p className='max-w-md text-slate-300 text-sm sm:text-base leading-relaxed'> In a post-apocalyptic world where 
            cities ride on wheels and consume each other to survive, two people meet in 
            London and try to stop a conspiracy.</p>

            <button onClick={()=> navigate('/movies')} className='flex items-center gap-2 px-7 py-3.5 bg-rose-600 hover:bg-rose-500 transition rounded-full font-bold text-sm sm:text-base text-white shadow-lg shadow-rose-600/30 cursor-pointer'>
                Explore Movies
                <ArrowRight className="w-4 h-4"/>
            </button>
          
        </div>
    );
};

export default HeroSection;