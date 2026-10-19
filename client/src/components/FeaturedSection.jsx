import { ArrowRight } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import BlurCircle from './BlurCircle'
import MovieCard from './MovieCard'
import { dummyShowsData } from "../assets/assets";

const FeaturedSection = () => {

    const navigate = useNavigate()
   return (

    <div className = 'px-6 md:px-16 lg:px-24 xl:px-44 overflow-hidden'>
       
       <div className = 'relative flex items-center justify-between pt-20 pb-10'>
        <BlurCircle top='0' right='-80px'/>
        <h2 className='text-white font-black text-3xl md:text-5xl'>Now Showing</h2>
        <button onClick={() => navigate ('/movies') } className='group flex 
        items-center gap-2 text-base sm:text-lg text-rose-400 hover:text-rose-300 cursor-pointer font-extrabold transition-colors'>
            View All
            <ArrowRight className='group-hover:translate-x-1.5 transition w-5 h-5'/>
        </button>
       </div>

       <div className='flex flex-wrap max-sm:justify-center gap-8 mt-8'>
        {dummyShowsData.slice(0,4).map((show) =>(
            <MovieCard key={show._id} movie={show}/>
        ))}
       </div>

       <div className='flex justify-center mt-20'>
        <button onClick ={()=> {navigate('/movies');scrollTo(0,0)}}
            className='px-12 py-4 text-base sm:text-lg bg-rose-600 hover:bg-rose-500 transition
            rounded-2xl font-black text-white shadow-xl shadow-rose-600/30 cursor-pointer hover:scale-105 active:scale-95'>Show more</button>
       </div>



    </div>





   )



}
export default FeaturedSection