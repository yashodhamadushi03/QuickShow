import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BlurCircle from "./BlurCircle";
import { ChevronLeftIcon } from "lucide-react";
import toast from "react-hot-toast";

const DateSelect = ({ dateTime, id }) => {
  const dates = dateTime ? Object.keys(dateTime) : [];
  const [selected, setSelected] = useState(dates[0] || null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!selected && dates.length > 0) {
      setSelected(dates[0]);
    }
  }, [dateTime]);

  const onBookHandler = () => {
    const targetDate = selected || dates[0];
    if (!targetDate) {
      return toast.error("No showtimes available for this movie right now.");
    }

    navigate(`/movies/${id}/${targetDate}`);
    window.scrollTo(0, 0);
  };

  return (
    <div id="dateSelect" className="pt-16">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative p-8 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle top="100px" right="0px" />
        <div>
          <p className="text-lg font-bold text-white mb-1">Select Date & Showtime</p>
          <p className="text-xs text-slate-400 mb-5">Choose an available slot to view the seat layout grid.</p>
          
          <div className="flex items-center gap-4 text-sm">
            <span className="flex flex-wrap gap-3">
              {dateTime && Object.keys(dateTime).map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelected(date)}
                  className={`flex flex-col items-center justify-center min-h-[85px] min-w-[90px] px-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    selected === date
                      ? "bg-rose-600 text-white font-bold shadow-lg shadow-rose-600/40 border border-rose-500 scale-105"
                      : "bg-slate-950 border border-slate-800 text-slate-300 hover:border-rose-500/50 hover:text-white"
                  }`}
                >
                  <span className="text-lg font-extrabold">{new Date(date).getDate()}</span>
                  <span className="text-xs font-semibold uppercase text-rose-300">
                    {new Date(date).toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span className="text-[11px] font-mono opacity-80 mt-1">
                    {new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                </button>
              ))}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onBookHandler}
          className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer whitespace-nowrap"
        >
          Select Seats & Book &rarr;
        </button>
      </div>
    </div>
  );
};

export default DateSelect;