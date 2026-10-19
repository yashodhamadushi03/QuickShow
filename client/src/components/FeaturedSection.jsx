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
        <h2 className='text-white font-extrabold text-2xl md:text-3xl'>Now Showing</h2>
        <button onClick={() => navigate ('/movies') } className='group flex 
        items-center gap-2 text-sm sm:text-base text-rose-400 hover:text-rose-300 cursor-pointer font-bold transition-colors'>
            View All
            <ArrowRight className='group-hover:translate-x-1 transition w-4.5 h-4.5'/>
        </button>
       </div>

       <div className='flex flex-wrap max-sm:justify-center gap-8 mt-8'>
        {dummyShowsData.slice(0,4).map((show) =>(
            <MovieCard key={show._id} movie={show}/>
        ))}
       </div>

       <div className='flex justify-center mt-20'>
        <button onClick ={()=> {navigate('/movies');scrollTo(0,0)}}
            className='px-10 py-3 text-sm sm:text-base bg-rose-600 hover:bg-rose-500 transition
            rounded-xl font-bold text-white shadow-lg shadow-rose-600/30 cursor-pointer'>Show more</button>
       </div>



    </div>





   )



}
export default FeaturedSection