import React, { useState, useEffect } from "react";
import { MapPin, Film, Sparkles, Phone, ShieldCheck, Search, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";

const Theaters = () => {
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const fallbackTheaters = [
    // Colombo & Suburbs
    {
      theater_id: 1,
      name: "Scope Cinemas Multiplex - Colombo City Centre",
      city: "Colombo 02",
      address: "137 Sir James Pieris Mawatha, Colombo 00200",
      phone: "+94 11 208 3000",
      halls: [
        { hall_id: 101, hall_name: "Screen 1 - Dolby Atmos", total_capacity: 96 },
        { hall_id: 102, hall_name: "Screen 2 - Laser 4K", total_capacity: 96 },
        { hall_id: 103, hall_name: "Screen 3 - Gold Class Luxury Lounge", total_capacity: 48 }
      ]
    },
    {
      theater_id: 2,
      name: "Scope Cinemas Multiplex - Havelock City Mall",
      city: "Colombo 05",
      address: "324 Havelock Rd, Colombo 00500",
      phone: "+94 11 208 3005",
      halls: [
        { hall_id: 201, hall_name: "Screen 1 - IMAX 3D Laser", total_capacity: 120 },
        { hall_id: 202, hall_name: "Screen 2 - Dolby Surround", total_capacity: 96 }
      ]
    },
    {
      theater_id: 3,
      name: "Liberty by Scope Cinemas",
      city: "Colombo 03",
      address: "35 R. A. De Mel Mawatha, Colpetty, Colombo 00300",
      phone: "+94 11 232 5250",
      halls: [
        { hall_id: 301, hall_name: "Cinema 1 - Main Auditorium", total_capacity: 150 },
        { hall_id: 302, hall_name: "Cinema 2 - VIP Recliner Suite", total_capacity: 60 }
      ]
    },
    {
      theater_id: 4,
      name: "Savoy 3D Dolby Atmos",
      city: "Colombo 06",
      address: "12 Galle Rd, Wellawatte, Colombo 00600",
      phone: "+94 11 236 2200",
      halls: [
        { hall_id: 401, hall_name: "Savoy 3D Main Screen", total_capacity: 180 },
        { hall_id: 402, hall_name: "Savoy Premier Lounge", total_capacity: 80 }
      ]
    },
    {
      theater_id: 5,
      name: "PVR Cinemas - One Galle Face Mall",
      city: "Colombo 02",
      address: "1A Centre Road, Galle Face, Colombo 00200",
      phone: "+94 11 208 4000",
      halls: [
        { hall_id: 501, hall_name: "PVR Playhouse", total_capacity: 90 },
        { hall_id: 502, hall_name: "PVR LUXE Lounge", total_capacity: 45 },
        { hall_id: 503, hall_name: "PVR Screen 3 4K", total_capacity: 96 }
      ]
    },
    // Major Regional Cities
    {
      theater_id: 6,
      name: "Regal Cinema - Cargills Square",
      city: "Jaffna",
      address: "Cargills Square, Kandy Road, Jaffna 40000",
      phone: "+94 21 222 4500",
      halls: [
        { hall_id: 601, hall_name: "Regal Screen 1", total_capacity: 96 },
        { hall_id: 602, hall_name: "Regal Screen 2", total_capacity: 96 }
      ]
    },
    {
      theater_id: 7,
      name: "Regal Cinema - Cargills Square",
      city: "Gampaha",
      address: "15 Cargills Square, Colombo Rd, Gampaha 11000",
      phone: "+94 33 223 8900",
      halls: [
        { hall_id: 701, hall_name: "Auditorium A", total_capacity: 96 },
        { hall_id: 702, hall_name: "Auditorium B", total_capacity: 96 }
      ]
    },
    {
      theater_id: 8,
      name: "Imperial 3D Cinema",
      city: "Kurunegala",
      address: "45 Colombo Rd, Kurunegala 60000",
      phone: "+94 37 222 1200",
      halls: [
        { hall_id: 801, hall_name: "Imperial 3D Main Screen", total_capacity: 110 }
      ]
    },
    {
      theater_id: 9,
      name: "Sky Lite 3D Cinema",
      city: "Matara",
      address: "88 Anagarika Dharmapala Mawatha, Matara 81000",
      phone: "+94 41 222 3400",
      halls: [
        { hall_id: 901, hall_name: "Sky Lite Screen 1", total_capacity: 96 }
      ]
    },
    {
      theater_id: 10,
      name: "Regal Cinema",
      city: "Nuwara Eliya",
      address: "Park Road, Nuwara Eliya 22200",
      phone: "+94 52 222 2300",
      halls: [
        { hall_id: 1001, hall_name: "Regal Nuwara Eliya Main", total_capacity: 90 }
      ]
    }
  ];

  useEffect(() => {
    fetchTheaters();
  }, []);

  const fetchTheaters = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/theaters`);
      if (response.ok) {
        const data = await response.json();
        setTheaters(data.length > 0 ? data : fallbackTheaters);
      } else {
        setTheaters(fallbackTheaters);
      }
    } catch (err) {
      console.warn("Backend API unavailable, using fallback islandwide theater data.", err);
      setTheaters(fallbackTheaters);
    } finally {
      setLoading(false);
    }
  };

  const cities = ["All", ...new Set(theaters.map((t) => t.city))];

  const filteredTheaters = theaters.filter((t) => {
    const matchesCity = selectedCity === "All" || t.city === selectedCity;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-16 px-6 md:px-16">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto mb-12 text-center md:text-left border-b border-slate-800 pb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-sm font-medium mb-4 border border-rose-500/20">
          <Sparkles className="w-4 h-4" /> Islandwide Sri Lankan Cinema Network
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-3">
          Explore Cinema Theaters Across Sri Lanka
        </h1>
        <p className="text-slate-200 text-lg sm:text-xl max-w-3xl leading-relaxed">
          Book movie showtimes across Scope Cinemas, Savoy, PVR, Regal, Imperial, and Sky Lite in Colombo, Jaffna, Gampaha, Kurunegala, Matara, and Nuwara Eliya.
        </p>

        {/* Filter Controls */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* City Pills */}
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-5 py-2.5 rounded-full text-base font-bold transition-all duration-200 ${
                  selectedCity === city
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                    : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search theater, city or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Theaters Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTheaters.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
            <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 text-xl font-bold">No cinema locations match your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTheaters.map((theater) => (
              <div
                key={theater.theater_id}
                className="group relative bg-slate-900/80 border border-slate-800/80 hover:border-rose-500/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-900/20 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3 className="text-2xl font-black text-white group-hover:text-rose-400 transition-colors">
                      {theater.name}
                    </h3>
                    <span className="px-3 py-1 bg-rose-500/10 text-rose-400 text-sm font-extrabold rounded-full border border-rose-500/20 shrink-0">
                      {theater.city}
                    </span>
                  </div>

                  <div className="space-y-2 text-slate-200 text-base mb-6">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{theater.address}</span>
                    </div>
                    {theater.phone && (
                      <div className="flex items-center gap-2.5 text-base text-slate-200">
                        <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                        <a href={`tel:${theater.phone}`} className="hover:text-rose-400 transition-colors font-mono font-medium">
                          {theater.phone}
                        </a>
                      </div>
                    )}
                  </div>

                    {/* Screening Halls */}
                    <div className="space-y-3 mb-6">
                      <div className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Film className="w-5 h-5 text-slate-400" /> Auditoriums ({theater.halls?.length || 0})
                      </div>
                      <div className="flex flex-col gap-2">
                        {theater.halls && theater.halls.length > 0 ? (
                          theater.halls.map((hall) => (
                            <Link
                              key={hall.hall_id}
                              to={`/movies?theater_id=${theater.theater_id}&theater_name=${encodeURIComponent(theater.name)}&hall_id=${hall.hall_id}&hall_name=${encodeURIComponent(hall.hall_name)}`}
                              state={{
                                theaterId: theater.theater_id,
                                theaterName: theater.name,
                                hallId: hall.hall_id,
                                hallName: hall.hall_name,
                              }}
                              className="flex items-center justify-between bg-slate-950/60 hover:bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-800/60 hover:border-rose-500/40 text-base text-slate-200 transition-colors group/hall cursor-pointer"
                            >
                              <span className="font-semibold text-white group-hover/hall:text-rose-400 transition-colors">
                                {hall.hall_name}
                              </span>
                              <span className="text-slate-300 font-mono text-sm font-bold flex items-center gap-1">
                                {hall.total_capacity ? `${hall.total_capacity} Seats` : "Multi-tier"}
                                <span className="text-rose-400 text-xs ml-1">&rarr;</span>
                              </span>
                            </Link>
                          ))
                        ) : (
                          <p className="text-base text-slate-400 italic">Auditoriums updating...</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm sm:text-base text-emerald-400 font-bold">
                      <ShieldCheck className="w-5 h-5" /> Dolby Atmos & 4K Laser
                    </div>
                    <Link
                      to={`/movies?theater_id=${theater.theater_id}&theater_name=${encodeURIComponent(theater.name)}`}
                      state={{
                        theaterId: theater.theater_id,
                        theaterName: theater.name,
                      }}
                      className="inline-flex items-center gap-1.5 text-base font-extrabold text-rose-500 hover:text-rose-400 transition-colors hover:scale-105"
                    >
                      Book at this Cinema &rarr;
                    </Link>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Theaters;
