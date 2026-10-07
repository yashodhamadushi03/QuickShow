import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BlurCircle from "./BlurCircle";
import { ChevronLeftIcon } from "lucide-react";
import toast from "react-hot-toast";

const DateSelect = ({ dateTime, id }) => {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const onBookHandler = () => {
    if (!selected) {
      return toast("Please Select a date");
    }

    navigate(`/movie/${id}/${selected}`);
    window.scrollTo(0, 0);
  };

  return (
    <div id="dateSelect" className="pt-30">
      <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative p-8 bg-primary/10 border border-primary/20 rounded-lg">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle top="100px" right="0px" />
        <div>
          <p className="text-lg font-semibold">Choose Date</p>
          <div className="flex items-center gap-6 text-sm mt-5">
            <ChevronLeftIcon width={28} />
            <span className="grid grid-cols-3 md:flex flex-wrap md:max-w-lg gap-4">
              {Object.keys(dateTime).map((date) => (
                <button
                  key={date}
                  onClick={() => setSelected(date)}
                  className={`flex flex-col items-center justify-center min-h-[90px] min-w-[80px] px-2 rounded-xl cursor-pointer ${
                    selected === date
                      ? "bg-red-600 text-white border-red-600"
                      : "border border-gray-300 text-white hover:border-red-500"
                  }`}
                >
                  <span>{new Date(date).getDate()}</span>
                  <span>
                    {new Date(date).toLocaleDateString("en-US", {
                      month: "short",
                    })}
                  </span>
                  <span>
                    {new Date(date).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </button>
              ))}
            </span>
          </div>
        </div>
        <button
             onClick={onBookHandler}
             className="bg-red-600 text-white px-8 py-2 mt-6 rounded-2xl hover:bg-red-700 transition-all cursor-pointer"
        >
           Book Now
           </button>
      </div>
    </div>
  );
};

export default DateSelect;