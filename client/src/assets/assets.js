import logo from './logo.svg'
import marvelLogo from './marvelLogo.svg'
import googlePlay from './googlePlay.svg'
import appStore from './appStore.svg'
import screenImage from './screenImage.svg'
import profile from './profile.png'

export const assets = {
    logo,
    marvelLogo,
    googlePlay,
    appStore,
    screenImage,
    profile
}

export const dummyTrailers = [
    {
        image: "https://img.youtube.com/vi/WpW36ldAqnM/maxresdefault.jpg",
        videoUrl: 'https://www.youtube.com/watch?v=WpW36ldAqnM'
    },
    {
        image: "https://img.youtube.com/vi/-sAOWhvheK8/maxresdefault.jpg",
        videoUrl: 'https://www.youtube.com/watch?v=-sAOWhvheK8'
    },
    {
        image: "https://img.youtube.com/vi/1pHDWnXmK7Y/maxresdefault.jpg",
        videoUrl: 'https://www.youtube.com/watch?v=1pHDWnXmK7Y'
    },
    {
        image: "https://img.youtube.com/vi/umiKiW4En9g/maxresdefault.jpg",
        videoUrl: 'https://www.youtube.com/watch?v=umiKiW4En9g'
    },
]

const dummyCastsData = [
    { "name": "Milla Jovovich", "profile_path": "https://image.tmdb.org/t/p/original/usWnHCzbADijULREZYSJ0qfM00y.jpg", },
    { "name": "Dave Bautista", "profile_path": "https://image.tmdb.org/t/p/original/snk6JiXOOoRjPtHU5VMoy6qbd32.jpg", },
    { "name": "Arly Jover", "profile_path": "https://image.tmdb.org/t/p/original/zmznPrQ9GSZwcOIUT0c3GyETwrP.jpg", },
    { "name": "Amara Okereke", "profile_path": "https://image.tmdb.org/t/p/original/nTSPtzWu6deZTJtWXHUpACVznY4.jpg", },
    { "name": "Fraser James", "profile_path": "https://image.tmdb.org/t/p/original/mGAPQG2OKTgdKFkp9YpvCSqcbgY.jpg", },
    { "name": "Deirdre Mullins", "profile_path": "https://image.tmdb.org/t/p/original/lJm89neuiVlYISEqNpGZA5kTAnP.jpg", },
    { "name": "Sebastian Stankiewicz", "profile_path": "https://image.tmdb.org/t/p/original/hLN0Ca09KwQOFLZLPIEzgTIbqqg.jpg", },
    { "name": "Tue Lunding", "profile_path": "https://image.tmdb.org/t/p/original/qY4W0zfGBYzlCyCC0QDJS1Muoa0.jpg", },
    { "name": "Jacek Dzisiewicz", "profile_path": "https://image.tmdb.org/t/p/original/6Ksb8ANhhoWWGnlM6O1qrySd7e1.jpg", },
    { "name": "Ian Hanmore", "profile_path": "https://image.tmdb.org/t/p/original/yhI4MK5atavKBD9wiJtaO1say1p.jpg", },
    { "name": "Eveline Hall", "profile_path": "https://image.tmdb.org/t/p/original/uPq4xUPiJIMW5rXF9AT0GrRqgJY.jpg", },
    { "name": "Kamila Klamut", "profile_path": "https://image.tmdb.org/t/p/original/usWnHCzbADijULREZYSJ0qfM00y.jpg", },
    { "name": "Caoilinn Springall", "profile_path": "https://image.tmdb.org/t/p/original/uZNtbPHowlBYo74U1qlTaRlrdiY.jpg", },
    { "name": "Jan Kowalewski", "profile_path": "https://image.tmdb.org/t/p/original/snk6JiXOOoRjPtHU5VMoy6qbd32.jpg", },
    { "name": "Pawel Wysocki", "profile_path": "https://image.tmdb.org/t/p/original/zmznPrQ9GSZwcOIUT0c3GyETwrP.jpg", },
    { "name": "Simon Lööf", "profile_path": "https://image.tmdb.org/t/p/original/cbZrB8crWlLEDjVUoak8Liak6s.jpg", },
    { "name": "Tomasz Cymerman", "profile_path": "https://image.tmdb.org/t/p/original/nTSPtzWu6deZTJtWXHUpACVznY4.jpg", }
]

export const FALLBACK_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800";
export const FALLBACK_BACKDROP = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200";
export const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200";

export const SL_SHOWTIME_SLOTS = [
    { slotId: "morning", slotName: "Morning Show", time: "10:00 AM", time24: "10:00", hour: 10, minute: 0, hall: "Screen 1 - Dolby Atmos 4K", experience: "Dolby Atmos 4K", price: 1500 },
    { slotId: "matinee", slotName: "Matinee Show", time: "01:00 PM", time24: "13:00", hour: 13, minute: 0, hall: "Screen 2 - Laser Ultra 4K", experience: "Laser Ultra 4K", price: 1500 },
    { slotId: "first", slotName: "First Show", time: "04:00 PM", time24: "16:00", hour: 16, minute: 0, hall: "Screen 1 - Dolby Atmos 4K", experience: "Dolby Atmos 4K", price: 1600 },
    { slotId: "second", slotName: "Second Show", time: "07:15 PM", time24: "19:15", hour: 19, minute: 15, hall: "Screen 3 - IMAX 3D Laser", experience: "IMAX 3D Laser", price: 1800 },
    { slotId: "night", slotName: "Night Show", time: "10:15 PM", time24: "22:15", hour: 22, minute: 15, hall: "Screen 1 - VIP Recliner Suite", experience: "VIP Luxury", price: 2000 },
];

export const dummyShowsData = [
    {
        "_id": "324544",
        "id": 324544,
        "title": "Avatar: The Way of Water",
        "overview": "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns, Jake must work with Neytiri to protect their land.",
        "poster_path": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800",
        "backdrop_path": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200",
        "genres": [
            { "id": 878, "name": "Sci-Fi" },
            { "id": 28, "name": "Action" }
        ],
        "casts": dummyCastsData,
        "release_date": "2024-05-15",
        "original_language": "en",
        "tagline": "Return to Pandora.",
        "vote_average": 8.5,
        "vote_count": 28500,
        "runtime": 192,
    },
    {
        "_id": "1232546",
        "id": 1232546,
        "title": "Dune: Part Two",
        "overview": "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
        "poster_path": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
        "backdrop_path": "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200",
        "genres": [
            { "id": 878, "name": "Sci-Fi" },
            { "id": 12, "name": "Adventure" }
        ],
        "casts": dummyCastsData,
        "release_date": "2024-03-01",
        "original_language": "en",
        "tagline": "Long live the fighters.",
        "vote_average": 8.8,
        "vote_count": 31000,
        "runtime": 166,
    },
    {
        "_id": "552524",
        "id": 552524,
        "title": "Kandak Sema",
        "overview": "A poignant Sri Lankan cinema masterpiece depicting cross-cultural romance, resilience, and personal triumph across majestic rural tea plantations.",
        "poster_path": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800",
        "backdrop_path": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1200",
        "genres": [
            { "id": 18, "name": "Drama" },
            { "id": 10749, "name": "Romance" }
        ],
        "casts": dummyCastsData,
        "release_date": "2024-05-10",
        "original_language": "si",
        "tagline": "A love that echoes across the hills.",
        "vote_average": 8.7,
        "vote_count": 14200,
        "runtime": 135,
    },
    {
        "_id": "668489",
        "id": 668489,
        "title": "The Greatest Of All Time (GOAT)",
        "overview": "An action-packed Tamil sci-fi espionage thriller featuring Thalapathy Vijay in high-octane suspense and double agent intrigue across international borders.",
        "poster_path": "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800",
        "backdrop_path": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1200",
        "genres": [
            { "id": 28, "name": "Action" },
            { "id": 878, "name": "Sci-Fi" }
        ],
        "casts": dummyCastsData,
        "release_date": "2024-09-05",
        "original_language": "ta",
        "tagline": "The legend never surrenders.",
        "vote_average": 8.6,
        "vote_count": 26900,
        "runtime": 178,
    }
];
const getDynamicDateString = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
export const dummyDateTimeData = (() => {
  const data = {};
  for (let offset = 0; offset < 7; offset++) {
    const dateStr = getDynamicDateString(offset);
    data[dateStr] = SL_SHOWTIME_SLOTS.map((slot, idx) => ({
      showId: offset * 5 + (idx + 1),
      slotId: slot.slotId,
      slotName: slot.slotName,
      time: slot.time,
      displayTime: slot.time,
      date: dateStr,
      hall: slot.hall,
      experience: slot.experience,
      price: slot.price,
      isoTime: `${dateStr}T${slot.time24}:00`,
      theater: "Scope Cinemas - Colombo City Centre"
    }));
  }
  return data;
})();

export const dummyDashboardData = {
    "totalBookings": 14,
    "totalRevenue": 1517,
    "totalUser": 5,
    "activeShows": []
}

export const dummyBookingData = []