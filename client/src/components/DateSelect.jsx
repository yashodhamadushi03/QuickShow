import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BlurCircle from "./BlurCircle";
import { Sun, Sunrise, Sunset, Moon, Clock, CheckCircle2, Sparkles, Film } from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "@clerk/clerk-react";
import { SL_SHOWTIME_SLOTS } from "../assets/assets";

const DateSelect = ({ dateTime, id, movie }) => {
  const dates = dateTime ? Object.keys(dateTime) : [];
  const [selectedDate, setSelectedDate] = useState(dates[0] || "");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();

  // Keep selected date valid
  useEffect(() => {
    if (!selectedDate && dates.length > 0) {
      setSelectedDate(dates[0]);
    }
  }, [dateTime, dates]);

  // When selected date changes, set default showtime slot
  useEffect(() => {
    if (selectedDate && dateTime && dateTime[selectedDate]) {
      const slots = dateTime[selectedDate];
      if (slots && slots.length > 0) {
        // Default to First Show (4:00 PM) or Second Show (7:15 PM) or first slot
        const preferred = slots.find((s) => s.slotName?.includes("Second") || s.slotName?.includes("7:15")) || slots[0];
        setSelectedSlot(preferred);
      }
    } else if (selectedDate) {
      // Fallback standard Sri Lankan slots
      const fallbackSlots = SL_SHOWTIME_SLOTS.map((s, idx) => ({
        showId: idx + 1,
        slotId: s.slotId,
        slotName: s.slotName,
        time: s.time,
        displayTime: s.time,
        date: selectedDate,
        hall: s.hall,
        experience: s.experience,
        price: s.price,
      }));
      setSelectedSlot(fallbackSlots[3] || fallbackSlots[0]);
    }
  }, [selectedDate, dateTime]);

  const formatDateCard = (dateStr) => {
    if (!dateStr) return { dayName: "", dayNumber: "", monthName: "", fullText: "", isToday: false };
    const parts = String(dateStr).split("-");
    const d = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();

    return {
      dayName: isToday ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString("en-US", { month: "short" }),
      fullText: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
      isToday,
    };
  };

  const getSlotIcon = (slotName = "") => {
    const s = slotName.toLowerCase();
    if (s.includes("morning")) return <Sunrise className="w-5 h-5 text-amber-400" />;
    if (s.includes("matinee")) return <Sun className="w-5 h-5 text-yellow-400" />;
    if (s.includes("first")) return <Sunset className="w-5 h-5 text-orange-400" />;
    if (s.includes("second")) return <Film className="w-5 h-5 text-rose-400" />;
    if (s.includes("night")) return <Moon className="w-5 h-5 text-indigo-400" />;
    return <Clock className="w-5 h-5 text-rose-400" />;
  };

  // Get active slots list for currently selected date
  const activeSlots = (dateTime && dateTime[selectedDate] && dateTime[selectedDate].length > 0)
    ? dateTime[selectedDate]
    : SL_SHOWTIME_SLOTS.map((s, idx) => ({
        showId: idx + 1,
        slotId: s.slotId,
        slotName: s.slotName,
        time: s.time,
        displayTime: s.time,
        date: selectedDate,
        hall: s.hall,
        experience: s.experience,
        price: s.price,
      }));

  const onBookHandler = () => {
    if (!selectedDate) {
      return toast.error("Please select a date to proceed.");
    }
    if (!selectedSlot) {
      return toast.error("Please choose one of the available showtimes.");
    }

    // Pass showtimeId and details cleanly to SeatLayout
    const showIdToUse = selectedSlot.showId || 1;
    const targetUrl = `/movies/${id}/${selectedDate}`;
    const bookingState = {
      selectedDate,
      selectedSlot,
      showtimeId: showIdToUse,
      movie,
    };

    // Smart authentication check: redirect unauthenticated users to Sign In with preserved booking state
    if (isLoaded && !isSignedIn) {
      toast("Please sign in to select seats and complete your booking.", {
        icon: "🔒",
        duration: 4000,
        style: {
          background: "#0f172a",
          color: "#fca5a5",
          border: "1px solid #f43f5e",
        },
      });
      navigate(`/sign-in?redirect_url=${encodeURIComponent(targetUrl)}`, {
        state: {
          returnUrl: targetUrl,
          ...bookingState,
        },
      });
      return;
    }

    navigate(targetUrl, {
      state: bookingState,
    });
    window.scrollTo(0, 0);
  };

  const selectedDateInfo = formatDateCard(selectedDate);

  return (
    <div id="dateSelect" className="pt-16 max-w-6xl mx-auto">
      <div className="relative p-6 sm:p-8 md:p-10 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle top="100px" right="0px" />

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider">
                🏛️ Sri Lankan Cinema Schedule
              </span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs sm:text-sm font-semibold">
                5 Daily Shows
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
              Select Date & Showtime
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mt-1">
              Choose your preferred date and showtime slot to reserve seats.
            </p>
          </div>
        </div>

        {/* 1. DATE PICKER STRIP */}
        <div className="mb-8">
          <p className="text-sm sm:text-base font-extrabold text-slate-400 uppercase tracking-wider mb-3.5 flex items-center gap-2">
            <span>1. Select Date</span>
            {selectedDateInfo.fullText && (
              <span className="text-rose-400 font-bold normal-case">&bull; {selectedDateInfo.fullText}</span>
            )}
          </p>

          <div className="flex items-center gap-3 overflow-x-auto pb-3 no-scrollbar pt-1">
            {dates.map((date) => {
              const card = formatDateCard(date);
              const isSelected = selectedDate === date;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`flex flex-col items-center justify-center min-w-[96px] sm:min-w-[110px] py-4 px-3 rounded-2xl cursor-pointer transition-all duration-200 select-none ${
                    isSelected
                      ? "bg-gradient-to-b from-rose-600 to-rose-700 text-white shadow-xl shadow-rose-600/40 border-2 border-rose-400 scale-105"
                      : "bg-slate-950/80 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <span className={`text-xs sm:text-sm font-bold uppercase tracking-wide ${isSelected ? "text-rose-100" : "text-slate-400"}`}>
                    {card.dayName}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black my-0.5">
                    {card.dayNumber}
                  </span>
                  <span className={`text-xs sm:text-sm font-extrabold uppercase tracking-wider ${isSelected ? "text-rose-200" : "text-rose-400"}`}>
                    {card.monthName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. SHOWTIME SLOTS GRID FOR SELECTED DATE */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm sm:text-base font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span>2. Available Showtimes for {selectedDateInfo.dayName}</span>
              <span className="text-rose-400 font-bold normal-case">({activeSlots.length} Slots Available)</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {activeSlots.map((slot, index) => {
              const isSlotSelected =
                selectedSlot &&
                (selectedSlot.slotId === slot.slotId ||
                  selectedSlot.time === slot.time ||
                  selectedSlot.showId === slot.showId);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`group relative flex flex-col p-4 rounded-2xl text-left cursor-pointer transition-all duration-200 ${
                    isSlotSelected
                      ? "bg-gradient-to-b from-rose-950/60 via-slate-900 to-slate-900 border-2 border-rose-500 shadow-xl shadow-rose-600/25 scale-[1.02]"
                      : "bg-slate-950/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                  }`}
                >
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getSlotIcon(slot.slotName)}
                      <span className="text-sm sm:text-base font-extrabold text-white">
                        {slot.slotName}
                      </span>
                    </div>
                    {isSlotSelected && (
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Showtime Display Time */}
                  <div className="my-1">
                    <span className={`text-xl sm:text-2xl font-black tracking-tight ${isSlotSelected ? "text-rose-400" : "text-white group-hover:text-rose-300"}`}>
                      {slot.displayTime || slot.time}
                    </span>
                  </div>

                  {/* Hall / Experience Specs */}
                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-1 mb-2 font-medium">
                    {slot.hall || "Dolby Atmos Screen"}
                  </p>

                  {/* Experience Tag & Price */}
                  <div className="mt-auto pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs sm:text-sm font-semibold">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-rose-300 border border-rose-500/20 text-xs">
                      {slot.experience || "Dolby Atmos"}
                    </span>
                    <span className="text-emerald-400 font-extrabold">
                      LKR {slot.price ? slot.price.toLocaleString() : "1,500"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. BOOKING SUMMARY & CALL TO ACTION */}
        <div className="pt-5 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm uppercase font-bold text-slate-400 tracking-wider">
                Selected Showtime
              </p>
              <p className="text-base sm:text-lg font-extrabold text-white">
                {selectedDateInfo.dayName}, {selectedDateInfo.dayNumber} {selectedDateInfo.monthName} &bull;{" "}
                <span className="text-rose-400 font-black">
                  {selectedSlot?.slotName} ({selectedSlot?.displayTime || selectedSlot?.time})
                </span>
              </p>
              <p className="text-xs sm:text-sm text-slate-400">
                {selectedSlot?.hall || "Screen 1 - Dolby Atmos 4K"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBookHandler}
            className="w-full md:w-auto bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-base sm:text-lg px-9 py-4 rounded-2xl shadow-xl shadow-rose-600/30 transition-all cursor-pointer whitespace-nowrap hover:scale-105 active:scale-95"
          >
            Select Seats & Book &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateSelect;