import React, { useState, useEffect } from "react";
import { MapPin, Film, Sparkles, Clock, Search, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000/api";

const Theaters = () => {
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const fallbackTheaters = [
    {
      theater_id: 1,
      name: "QuickShow Grand Cinema",
      city: "New York",
      address: "450 7th Ave, Manhattan, NY 10123",
      halls: [
        { hall_id: 101, hall_name: "Screen 1 - IMAX Laser", total_capacity: 120 },
        { hall_id: 102, hall_name: "Screen 2 - Dolby Atmos", total_capacity: 85 },
        { hall_id: 103, hall_name: "Screen 3 - VIP Luxe Recliners", total_capacity: 50 }
      ]
    },
    {
      theater_id: 2,
      name: "StarPlex Cinema Complex",
      city: "Los Angeles",
      address: "6801 Hollywood Blvd, Los Angeles, CA 90028",
      halls: [
        { hall_id: 201, hall_name: "Hall A - IMAX 3D", total_capacity: 150 },
        { hall_id: 202, hall_name: "Hall B - Ultra HD 4K", total_capacity: 90 }
      ]
    },
    {
      theater_id: 3,
      name: "CinePremier Horizon",
      city: "Chicago",
      address: "120 N Michigan Ave, Chicago, IL 60601",
      halls: [
        { hall_id: 301, hall_name: "Auditorium 1 - Premium 70mm", total_capacity: 110 },
        { hall_id: 302, hall_name: "Auditorium 2 - VIP Lounge", total_capacity: 40 }
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
      console.warn("Backend API unavailable, using fallback theater data.", err);
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
          <Sparkles className="w-4 h-4" /> Cinema Locations & Experiences
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
          Explore Cinema Theaters
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Discover state-of-the-art screening halls, IMAX Laser venues, and VIP recliner auditoriums near you.
        </p>

        {/* Filter Controls */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* City Pills */}
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  selectedCity === city
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                    : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search theater or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
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
            <p className="text-slate-400 text-lg">No theaters match your search criteria.</p>
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
                    <h3 className="text-2xl font-bold text-white group-hover:text-rose-400 transition-colors">
                      {theater.name}
                    </h3>
                    <span className="px-3 py-1 bg-rose-500/10 text-rose-400 text-xs font-semibold rounded-full border border-rose-500/20 shrink-0">
                      {theater.city}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 text-slate-400 text-sm mb-6">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{theater.address}</span>
                  </div>

                  {/* Screening Halls */}
                  <div className="space-y-3 mb-6">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-slate-400" /> Screening Halls ({theater.halls?.length || 0})
                    </div>
                    <div className="flex flex-col gap-2">
                      {theater.halls && theater.halls.length > 0 ? (
                        theater.halls.map((hall) => (
                          <div
                            key={hall.hall_id}
                            className="flex items-center justify-between bg-slate-950/60 px-3.5 py-2.5 rounded-xl border border-slate-800/60 text-xs text-slate-300"
                          >
                            <span className="font-medium text-slate-200">{hall.hall_name}</span>
                            <span className="text-slate-500 font-mono">
                              {hall.total_capacity ? `${hall.total_capacity} Seats` : "Multi-seat"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic">Halls list updating...</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <ShieldCheck className="w-4 h-4" /> 4K Laser Projection
                  </div>
                  <Link
                    to="/movies"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors"
                  >
                    View Movies & Showtimes &rarr;
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
