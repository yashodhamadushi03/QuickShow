import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BlurCircle from "./BlurCircle";
import { Sun, Sunrise, Sunset, Moon, Clock, CheckCircle2, Sparkles, Film, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "@clerk/clerk-react";
import { SL_SHOWTIME_SLOTS } from "../assets/assets";

const DateSelect = ({
  dateTime,
  id,
  movie,
  initialTheaterId,
  initialTheaterName,
  initialHallId,
  initialHallName,
  theaters = []
}) => {
  const dates = dateTime ? Object.keys(dateTime) : [];
  const [selectedDate, setSelectedDate] = useState(dates[0] || "");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();

  const defaultTheaters = [
    {
      theater_id: 1,
      name: "Scope Cinemas Multiplex - Colombo City Centre",
      city: "Colombo 02",
      halls: [
        { hall_id: 101, hall_name: "Screen 1 - Dolby Atmos" },
        { hall_id: 102, hall_name: "Screen 2 - Laser 4K" },
        { hall_id: 103, hall_name: "Screen 3 - Gold Class Luxury Lounge" }
      ]
    },
    {
      theater_id: 2,
      name: "Scope Cinemas Multiplex - Havelock City Mall",
      city: "Colombo 05",
      halls: [
        { hall_id: 201, hall_name: "Screen 1 - IMAX 3D Laser" },
        { hall_id: 202, hall_name: "Screen 2 - Dolby Surround" }
      ]
    },
    {
      theater_id: 3,
      name: "Liberty by Scope Cinemas",
      city: "Colombo 03",
      halls: [
        { hall_id: 301, hall_name: "Cinema 1 - Main Auditorium" },
        { hall_id: 302, hall_name: "Cinema 2 - VIP Recliner Suite" }
      ]
    },
    {
      theater_id: 4,
      name: "Savoy 3D Dolby Atmos",
      city: "Colombo 06",
      halls: [
        { hall_id: 401, hall_name: "Savoy 3D Main Screen" },
        { hall_id: 402, hall_name: "Savoy Premier Lounge" }
      ]
    },
    {
      theater_id: 5,
      name: "PVR Cinemas - One Galle Face Mall",
      city: "Colombo 02",
      halls: [
        { hall_id: 501, hall_name: "PVR Playhouse" },
        { hall_id: 502, hall_name: "PVR LUXE Lounge" },
        { hall_id: 503, hall_name: "PVR Screen 3 4K" }
      ]
    },
    {
      theater_id: 6,
      name: "Regal Cinema - Cargills Square",
      city: "Jaffna",
      halls: [
        { hall_id: 601, hall_name: "Regal Screen 1" },
        { hall_id: 602, hall_name: "Regal Screen 2" }
      ]
    },
    {
      theater_id: 7,
      name: "Regal Cinema - Cargills Square",
      city: "Gampaha",
      halls: [
        { hall_id: 701, hall_name: "Auditorium A" },
        { hall_id: 702, hall_name: "Auditorium B" }
      ]
    },
    {
      theater_id: 8,
      name: "Imperial 3D Cinema",
      city: "Kurunegala",
      halls: [
        { hall_id: 801, hall_name: "Imperial 3D Main Screen" }
      ]
    },
    {
      theater_id: 9,
      name: "Sky Lite 3D Cinema",
      city: "Matara",
      halls: [
        { hall_id: 901, hall_name: "Sky Lite Screen 1" }
      ]
    },
    {
      theater_id: 10,
      name: "Regal Cinema",
      city: "Nuwara Eliya",
      halls: [
        { hall_id: 1001, hall_name: "Regal Nuwara Eliya Main" }
      ]
    }
  ];

  const availableTheaters = theaters.length > 0 ? theaters : defaultTheaters;

  // Selected Theater State
  const [selectedTheater, setSelectedTheater] = useState(() => {
    if (initialTheaterId) {
      const match = availableTheaters.find((t) => String(t.theater_id) === String(initialTheaterId));
      if (match) return match;
    }
    if (initialTheaterName) {
      const match = availableTheaters.find((t) => t.name.toLowerCase().includes(initialTheaterName.toLowerCase()));
      if (match) return match;
    }
    return availableTheaters[0];
  });

  // Selected Hall State
  const [selectedHall, setSelectedHall] = useState(() => {
    if (initialHallId && selectedTheater?.halls) {
      const match = selectedTheater.halls.find((h) => String(h.hall_id) === String(initialHallId));
      if (match) return match;
    }
    return selectedTheater?.halls?.[0] || { hall_id: 1, hall_name: "Screen 1 - Dolby Atmos" };
  });

  // Keep selected theater in sync if initial props change
  useEffect(() => {
    if (initialTheaterId) {
      const match = availableTheaters.find((t) => String(t.theater_id) === String(initialTheaterId));
      if (match) {
        setSelectedTheater(match);
        if (initialHallId && match.halls) {
          const hMatch = match.halls.find((h) => String(h.hall_id) === String(initialHallId));
          if (hMatch) setSelectedHall(hMatch);
          else if (match.halls[0]) setSelectedHall(match.halls[0]);
        } else if (match.halls?.[0]) {
          setSelectedHall(match.halls[0]);
        }
      }
    }
  }, [initialTheaterId, initialTheaterName, theaters]);

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
        const preferred = slots.find((s) => s.slotName?.includes("Second") || s.slotName?.includes("7:15")) || slots[0];
        setSelectedSlot(preferred);
      }
    } else if (selectedDate) {
      const fallbackSlots = SL_SHOWTIME_SLOTS.map((s, idx) => ({
        showId: idx + 1,
        slotId: s.slotId,
        slotName: s.slotName,
        time: s.time,
        displayTime: s.time,
        date: selectedDate,
        theater_id: selectedTheater?.theater_id || 1,
        theater: selectedTheater?.name || "Scope Cinemas - Colombo City Centre",
        hall_id: selectedHall?.hall_id || 1,
        hall: selectedHall?.hall_name || s.hall,
        experience: s.experience,
        price: s.price,
      }));
      setSelectedSlot(fallbackSlots[3] || fallbackSlots[0]);
    }
  }, [selectedDate, dateTime, selectedTheater, selectedHall]);

  const handleTheaterChange = (theater) => {
    setSelectedTheater(theater);
    if (theater.halls && theater.halls.length > 0) {
      setSelectedHall(theater.halls[0]);
    } else {
      setSelectedHall({ hall_id: 1, hall_name: "Main Auditorium" });
    }
    toast.success(`Selected ${theater.name} (${theater.city})`, { icon: "🏛️" });
  };

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

  // Active slots for selected date with theater and hall bindings
  const activeSlots = (dateTime && dateTime[selectedDate] && dateTime[selectedDate].length > 0)
    ? dateTime[selectedDate].map((s, idx) => ({
        ...s,
        theater_id: selectedTheater?.theater_id || 1,
        theater: selectedTheater?.name || "Scope Cinemas - Colombo City Centre",
        hall_id: selectedHall?.hall_id || 1,
        hall: selectedHall?.hall_name || s.hall,
      }))
    : SL_SHOWTIME_SLOTS.map((s, idx) => ({
        showId: idx + 1,
        slotId: s.slotId,
        slotName: s.slotName,
        time: s.time,
        displayTime: s.time,
        date: selectedDate,
        theater_id: selectedTheater?.theater_id || 1,
        theater: selectedTheater?.name || "Scope Cinemas - Colombo City Centre",
        hall_id: selectedHall?.hall_id || 1,
        hall: selectedHall?.hall_name || s.hall,
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

    const showIdToUse = selectedSlot.showId || 1;
    const theaterIdToUse = selectedTheater?.theater_id || selectedSlot.theater_id || 1;
    const theaterNameToUse = selectedTheater?.name || selectedSlot.theater || "Scope Cinemas Multiplex - Colombo City Centre";
    const hallIdToUse = selectedHall?.hall_id || selectedSlot.hall_id || 1;
    const hallNameToUse = selectedHall?.hall_name || selectedSlot.hall || "Screen 1 - Dolby Atmos";

    const queryParams = new URLSearchParams();
    queryParams.set("theater_id", theaterIdToUse);
    queryParams.set("theater_name", theaterNameToUse);
    queryParams.set("hall_id", hallIdToUse);
    queryParams.set("hall_name", hallNameToUse);
    queryParams.set("showtime_id", showIdToUse);

    const targetUrl = `/movies/${id}/${selectedDate}?${queryParams.toString()}`;
    const bookingState = {
      selectedDate,
      selectedSlot: {
        ...selectedSlot,
        theater_id: theaterIdToUse,
        theater: theaterNameToUse,
        hall_id: hallIdToUse,
        hall: hallNameToUse,
      },
      showtimeId: showIdToUse,
      theaterId: theaterIdToUse,
      theaterName: theaterNameToUse,
      hallId: hallIdToUse,
      hallName: hallNameToUse,
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
              Select Cinema, Date & Showtime
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mt-1">
              Choose your cinema location, screening date, and showtime slot to reserve seats.
            </p>
          </div>
        </div>

        {/* 1. THEATER LOCATION SELECTOR */}
        <div className="mb-8 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <p className="text-sm sm:text-base font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-500" />
              <span>1. Choose Cinema Multiplex Branch</span>
            </p>
            {selectedTheater && (
              <span className="px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full text-xs font-bold border border-rose-500/20 self-start sm:self-auto">
                Selected: {selectedTheater.city}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableTheaters.map((t) => {
              const isSelected = String(t.theater_id) === String(selectedTheater?.theater_id);
              return (
                <button
                  key={t.theater_id}
                  type="button"
                  onClick={() => handleTheaterChange(t)}
                  className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-gradient-to-r from-rose-950/60 to-slate-900 border-rose-500 shadow-md shadow-rose-600/20 text-white"
                      : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm sm:text-base line-clamp-1">{t.name}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                  </div>
                  <span className="text-xs text-slate-400 mt-1.5">{t.city}</span>
                </button>
              );
            })}
          </div>

          {/* Auditorium Selector if Theater has multiple screens */}
          {selectedTheater?.halls && selectedTheater.halls.length > 1 && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mr-2">
                Auditorium Screen:
              </span>
              {selectedTheater.halls.map((h) => {
                const isHallSelected = String(h.hall_id) === String(selectedHall?.hall_id);
                return (
                  <button
                    key={h.hall_id}
                    type="button"
                    onClick={() => setSelectedHall(h)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      isHallSelected
                        ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {h.hall_name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. DATE PICKER STRIP */}
        <div className="mb-8">
          <p className="text-sm sm:text-base font-extrabold text-slate-400 uppercase tracking-wider mb-3.5 flex items-center gap-2">
            <span>2. Select Screening Date</span>
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

        {/* 3. SHOWTIME SLOTS GRID FOR SELECTED DATE */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm sm:text-base font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span>3. Available Showtimes for {selectedDateInfo.dayName}</span>
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
                    {slot.hall || selectedHall?.hall_name || "Screen 1 - Dolby Atmos"}
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

        {/* 4. BOOKING SUMMARY & CALL TO ACTION */}
        <div className="pt-5 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm uppercase font-bold text-slate-400 tracking-wider">
                Selected Booking Summary
              </p>
              <p className="text-base sm:text-lg font-extrabold text-white">
                {selectedTheater?.name || "Scope Cinemas Multiplex"} &bull;{" "}
                <span className="text-rose-400 font-black">
                  {selectedSlot?.slotName} ({selectedSlot?.displayTime || selectedSlot?.time})
                </span>
              </p>
              <p className="text-xs sm:text-sm text-slate-300">
                {selectedHall?.hall_name || "Screen 1 - Dolby Atmos"} &bull; {selectedDateInfo.dayName}, {selectedDateInfo.dayNumber} {selectedDateInfo.monthName}
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