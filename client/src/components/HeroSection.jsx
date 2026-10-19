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

    <h1 className='text-5xl md:text-7xl font-black text-white leading-tight
        max-w-xl'>Guardians <br/>of the Galaxy</h1>

        <div className='flex items-center gap-4 text-slate-200 text-base sm:text-lg font-bold'>
            <span>Action | Adventure | Sci-Fi</span>
            <div className = 'flex items-center gap-1.5'>
            <Calendar1Icon className='w-5 h-5 text-rose-500' /> 2018
            </div>

            <div className = 'flex items-center gap-1.5'>
            <ClockIcon className='w-5 h-5 text-rose-500' /> 2h 8m

            </div>
            
          </div>

          <p className='max-w-xl text-slate-200 text-base sm:text-lg leading-relaxed font-normal'> In a post-apocalyptic world where 
            cities ride on wheels and consume each other to survive, two people meet in 
            London and try to stop a conspiracy.</p>

            <button onClick={()=> navigate('/movies')} className='flex items-center gap-2.5 px-8 py-4 bg-rose-600 hover:bg-rose-500 transition rounded-full font-black text-base sm:text-lg text-white shadow-xl shadow-rose-600/30 cursor-pointer hover:scale-105 active:scale-95'>
                Explore Movies
                <ArrowRight className="w-5 h-5"/>
            </button>
          
        </div>
    );
};

export default HeroSection;