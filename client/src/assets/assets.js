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
    { slotName: "Morning Show", time: "10:00 AM", hour: 10, minute: 0 },
    { slotName: "Matinee Show", time: "01:00 PM", hour: 13, minute: 0 },
    { slotName: "First Show", time: "04:00 PM", hour: 16, minute: 0 },
    { slotName: "Second Show", time: "07:15 PM", hour: 19, minute: 15 },
    { slotName: "Night Show", time: "10:15 PM", hour: 22, minute: 15 },
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
]

// Dynamic Date Generator relative to real-world current date
const getDynamicDateString = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const d0 = getDynamicDateString(0);
const d1 = getDynamicDateString(1);
const d2 = getDynamicDateString(2);
const d3 = getDynamicDateString(3);

// Standard Sri Lankan Cinema Showtime Slots:
// Morning Show: 10:00 AM | Matinee Show: 1:00 PM | First Show: 4:00 PM | Second Show: 7:15 PM | Night Show: 10:15 PM
export const dummyDateTimeData = {
    [d0]: [
        { "time": `${d0}T10:00:00.000Z`, "showId": "show_1", "slotName": "Morning Show (10:00 AM)" },
        { "time": `${d0}T13:00:00.000Z`, "showId": "show_2", "slotName": "Matinee Show (01:00 PM)" },
        { "time": `${d0}T16:00:00.000Z`, "showId": "show_3", "slotName": "First Show (04:00 PM)" },
        { "time": `${d0}T19:15:00.000Z`, "showId": "show_4", "slotName": "Second Show (07:15 PM)" },
        { "time": `${d0}T22:15:00.000Z`, "showId": "show_5", "slotName": "Night Show (10:15 PM)" }
    ],
    [d1]: [
        { "time": `${d1}T10:00:00.000Z`, "showId": "show_6", "slotName": "Morning Show (10:00 AM)" },
        { "time": `${d1}T13:00:00.000Z`, "showId": "show_7", "slotName": "Matinee Show (01:00 PM)" },
        { "time": `${d1}T16:00:00.000Z`, "showId": "show_8", "slotName": "First Show (04:00 PM)" },
        { "time": `${d1}T19:15:00.000Z`, "showId": "show_9", "slotName": "Second Show (07:15 PM)" },
        { "time": `${d1}T22:15:00.000Z`, "showId": "show_10", "slotName": "Night Show (10:15 PM)" }
    ],
    [d2]: [
        { "time": `${d2}T10:00:00.000Z`, "showId": "show_11", "slotName": "Morning Show (10:00 AM)" },
        { "time": `${d2}T13:00:00.000Z`, "showId": "show_12", "slotName": "Matinee Show (01:00 PM)" },
        { "time": `${d2}T16:00:00.000Z`, "showId": "show_13", "slotName": "First Show (04:00 PM)" },
        { "time": `${d2}T19:15:00.000Z`, "showId": "show_14", "slotName": "Second Show (07:15 PM)" },
        { "time": `${d2}T22:15:00.000Z`, "showId": "show_15", "slotName": "Night Show (10:15 PM)" }
    ],
    [d3]: [
        { "time": `${d3}T10:00:00.000Z`, "showId": "show_16", "slotName": "Morning Show (10:00 AM)" },
        { "time": `${d3}T13:00:00.000Z`, "showId": "show_17", "slotName": "Matinee Show (01:00 PM)" },
        { "time": `${d3}T16:00:00.000Z`, "showId": "show_18", "slotName": "First Show (04:00 PM)" },
        { "time": `${d3}T19:15:00.000Z`, "showId": "show_19", "slotName": "Second Show (07:15 PM)" },
        { "time": `${d3}T22:15:00.000Z`, "showId": "show_20", "slotName": "Night Show (10:15 PM)" }
    ]
}

export const dummyDashboardData = {
    "totalBookings": 14,
    "totalRevenue": 1517,
    "totalUser": 5,
    "activeShows": []
}

export const dummyBookingData = []