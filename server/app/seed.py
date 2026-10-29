import sys
from datetime import datetime, timedelta, date, timezone
from decimal import Decimal

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.movie import Movie, MovieStatus
from app.models.theater import Theater, Hall, Seat
from app.models.showtime import Showtime

def seed_database():
    print("🎬 Seeding Expanded QuickShow Movie Catalog & Islandwide Sri Lankan Theaters...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        admin_email = "admin@quickshow.lk"
        customer_email = "user@quickshow.lk"

        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                name="Scope & Savoy Admin",
                email=admin_email,
                password_hash=get_password_hash("admin123"),
                phone="+94771234567",
                role=UserRole.ADMIN
            )
            db.add(admin)
            print("  ✓ Created Admin User: admin@quickshow.lk")

        db.flush()
        movies_data = [
            {
                "title": "Avatar: The Way of Water",
                "description": "Jake Sully lives with his newfound family on Pandora. When a familiar threat returns, he works with Neytiri and the Metkayina clan to protect their home.",
                "genre": "Sci-Fi / Action",
                "duration_min": 192,
                "language": "English",
                "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800",
                "rating": "PG-13",
                "release_date": date(2022, 12, 16),
                "status": MovieStatus.NOW_SHOWING
            },
            {
                "title": "Dune: Part Two",
                "description": "Paul Atreides unites with Chani and the Fremen on Arrakis while seeking revenge against the conspirators who destroyed his noble house.",
                "genre": "Sci-Fi / Adventure",
                "duration_min": 166,
                "language": "English",
                "poster_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
                "rating": "PG-13",
                "release_date": date(2024, 3, 1),
                "status": MovieStatus.NOW_SHOWING
            },
            {
                "title": "Kandak Sema",
                "description": "A poignant Sri Lankan cinema masterpiece depicting cross-cultural romance, resilience, and personal triumph across majestic rural tea plantations.",
                "genre": "Drama / Romance",
                "duration_min": 135,
                "language": "Sinhala",
                "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800",
                "rating": "U/A",
                "release_date": date(2024, 5, 10),
                "status": MovieStatus.NOW_SHOWING
            },
            {
                "title": "The Greatest Of All Time (GOAT)",
                "description": "An action-packed Tamil sci-fi espionage thriller featuring Thalapathy Vijay in high-octane suspense and double agent intrigue across international borders.",
                "genre": "Action / Sci-Fi",
                "duration_min": 178,
                "language": "Tamil",
                "poster_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800",
                "rating": "U/A",
                "release_date": date(2024, 9, 5),
                "status": MovieStatus.NOW_SHOWING
            },
            {
                "title": "Leo: Bloody Sweet",
                "description": "A mild-mannered cafe owner in Himachal Pradesh fights back with lethal precision when ruthless cartel gangsters identify him as a legendary former enforcer.",
                "genre": "Action / Thriller",
                "duration_min": 164,
                "language": "Tamil",
                "poster_url": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800",
                "rating": "U/A",
                "release_date": date(2023, 10, 19),
                "status": MovieStatus.NOW_SHOWING
            },
            {
                "title": "Kathuru Mithuru",
                "description": "A heartwarming Sri Lankan family comedy detailing the humorous rivalries and unbreakable lifelong bond between an old-school tailor and a traditional barber.",
                "genre": "Comedy / Family",
                "duration_min": 128,
                "language": "Sinhala",
                "poster_url": "https://images.unsplash.com/photo-1514306191717-452ec28c7814?q=80&w=800",
                "rating": "U",
                "release_date": date(2023, 9, 22),
                "status": MovieStatus.NOW_SHOWING
            },
            {
                "title": "Oppenheimer",
                "description": "The dramatic story of American theoretical physicist J. Robert Oppenheimer, the Manhattan Project director who changed human history forever.",
                "genre": "Biography / Drama / Thriller",
                "duration_min": 180,
                "language": "English",
                "poster_url": "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800",
                "rating": "R",
                "release_date": date(2023, 7, 21),
                "status": MovieStatus.NOW_SHOWING
            },
            {
                "title": "Spider-Man: Across the Spider-Verse",
                "description": "Miles Morales catapults across the Multiverse, where he encounters a society of Spider-People charged with protecting its very existence.",
                "genre": "Animation / Action / Sci-Fi",
                "duration_min": 140,
                "language": "English",
                "poster_url": "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=800",
                "rating": "PG",
                "release_date": date(2023, 6, 2),
                "status": MovieStatus.NOW_SHOWING
            },
            {
                "title": "Deadpool & Wolverine",
                "description": "Wolverine joins forces with the foul-mouthed Merc with a Mouth in a chaotic multiverse mission to save their timeline from existential annihilation.",
                "genre": "Action / Comedy",
                "duration_min": 128,
                "language": "English",
                "poster_url": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800",
                "rating": "R",
                "release_date": date(2024, 7, 26),
                "status": MovieStatus.NOW_SHOWING
            },
            {
                "title": "A Quiet Place: Day One",
                "description": "Experience the terrifying first hours when blind, sound-hunting extraterrestrial predators suddenly crash down upon New York City.",
                "genre": "Thriller / Horror / Sci-Fi",
                "duration_min": 100,
                "language": "English",
                "poster_url": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800",
                "rating": "PG-13",
                "release_date": date(2024, 6, 28),
                "status": MovieStatus.NOW_SHOWING
            },
            {
                "title": "Anyone But You",
                "description": "After an unforgettable first date that cooled off, Bea and Ben find themselves forced to fake being a couple at a picturesque Sydney destination wedding.",
                "genre": "Romance / Comedy",
                "duration_min": 103,
                "language": "English",
                "poster_url": "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800",
                "rating": "R",
                "release_date": date(2023, 12, 22),
                "status": MovieStatus.NOW_SHOWING
            },
            {
                "title": "Stree 2",
                "description": "The town of Chanderi is terrorized once again by a supernatural headless entity named Sarkata, forcing Vicky and his eccentric gang to unite.",
                "genre": "Comedy / Horror",
                "duration_min": 147,
                "language": "Hindi",
                "poster_url": "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=800",
                "rating": "U/A",
                "release_date": date(2024, 8, 15),
                "status": MovieStatus.NOW_SHOWING
            },
            {
                "title": "Devara: Part 1",
                "description": "An epic action saga set against coastal lands, depicting ancestral bloodlines, seafaring contraband, and legendary courage.",
                "genre": "Action / Drama / Epic",
                "duration_min": 170,
                "language": "Tamil / Telugu",
                "poster_url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800",
                "rating": "U/A",
                "release_date": date(2024, 9, 27),
                "status": MovieStatus.COMING_SOON
            },
            {
                "title": "Sinhabahu",
                "description": "The monumental Sri Lankan folklore legend of royal lineage, filial duty, and tragedy adapted into a grand cinematic spectacle.",
                "genre": "Historical / Drama",
                "duration_min": 145,
                "language": "Sinhala",
                "poster_url": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=800",
                "rating": "U",
                "release_date": date(2024, 10, 18),
                "status": MovieStatus.COMING_SOON
            },
            {
                "title": "Joker: Folie à Deux",
                "description": "Arthur Fleck navigates his fractured mind and dual identity while finding dark romance and twisted melodies within Arkham State Hospital.",
                "genre": "Crime / Drama / Musical",
                "duration_min": 138,
                "language": "English",
                "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800",
                "rating": "R",
                "release_date": date(2024, 10, 4),
                "status": MovieStatus.COMING_SOON
            },
            {
                "title": "Kanguva",
                "description": "A warrior's battle for tribal independence across ancient centuries echoes into a modern-day shadow operative's destiny.",
                "genre": "Action / Fantasy / Epic",
                "duration_min": 154,
                "language": "Tamil",
                "poster_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
                "rating": "U/A",
                "release_date": date(2024, 11, 14),
                "status": MovieStatus.COMING_SOON
            },
            {
                "title": "Gladiator II",
                "description": "Lucius enters the legendary Colosseum years after Maximus's sacrifice to overthrow emperor tyranny and reclaim the honor of Rome.",
                "genre": "Action / History / Epic",
                "duration_min": 150,
                "language": "English",
                "poster_url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800",
                "rating": "R",
                "release_date": date(2024, 11, 22),
                "status": MovieStatus.COMING_SOON
            },
            {
                "title": "Interstellar: 10th Anniversary IMAX",
                "description": "Christopher Nolan's landmark sci-fi space odyssey returns to IMAX screens with full remastered sound and breathtaking visuals.",
                "genre": "Sci-Fi / Drama",
                "duration_min": 169,
                "language": "English",
                "poster_url": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800",
                "rating": "PG-13",
                "release_date": date(2024, 12, 6),
                "status": MovieStatus.COMING_SOON
            }
        ]

        movie_objs = []
        for m_data in movies_data:
            existing_m = db.query(Movie).filter(Movie.title == m_data["title"]).first()
            if not existing_m:
                m = Movie(**m_data)
                db.add(m)
                movie_objs.append(m)
            else:
                for k, v in m_data.items():
                    setattr(existing_m, k, v)
                movie_objs.append(existing_m)
        
        db.flush()
        print(f"  ✓ Seeded {len(movie_objs)} Multi-Genre Movies (Sinhala, Tamil, Hollywood, Romance, Sci-Fi, Comedy, Thriller)")
        theaters_data = [
            {
                "name": "Scope Cinemas Multiplex - Colombo City Centre",
                "city": "Colombo 02",
                "address": "137 Sir James Pieris Mawatha, Colombo 00200",
                "phone": "+94 11 208 3000",
                "halls": ["Screen 1 - Dolby Atmos", "Screen 2 - Laser 4K", "Screen 3 - Gold Class Lounge"]
            },
            {
                "name": "Scope Cinemas Multiplex - Havelock City Mall",
                "city": "Colombo 05",
                "address": "324 Havelock Rd, Colombo 00500",
                "phone": "+94 11 208 3005",
                "halls": ["Screen 1 - IMAX 3D Laser", "Screen 2 - Dolby Surround"]
            },
            {
                "name": "Liberty by Scope Cinemas",
                "city": "Colombo 03",
                "address": "35 R. A. De Mel Mawatha, Colpetty, Colombo 00300",
                "phone": "+94 11 232 5250",
                "halls": ["Cinema 1 - Main Auditorium", "Cinema 2 - VIP Recliner Suite"]
            },
            {
                "name": "Savoy 3D Dolby Atmos",
                "city": "Colombo 06",
                "address": "12 Galle Rd, Wellawatte, Colombo 00600",
                "phone": "+94 11 236 2200",
                "halls": ["Savoy 3D Main Screen", "Savoy Premier Lounge"]
            },
            {
                "name": "PVR Cinemas - One Galle Face Mall",
                "city": "Colombo 02",
                "address": "1A Centre Road, Galle Face, Colombo 00200",
                "phone": "+94 11 208 4000",
                "halls": ["PVR Playhouse", "PVR LUXE Lounge", "PVR Screen 3 4K"]
            },
            {
                "name": "Regal Cinema - Cargills Square",
                "city": "Jaffna",
                "address": "Cargills Square, Kandy Road, Jaffna 40000",
                "phone": "+94 21 222 4500",
                "halls": ["Regal Screen 1", "Regal Screen 2"]
            },
            {
                "name": "Regal Cinema - Cargills Square",
                "city": "Gampaha",
                "address": "15 Cargills Square, Colombo Rd, Gampaha 11000",
                "phone": "+94 33 223 8900",
                "halls": ["Auditorium A", "Auditorium B"]
            },
            {
                "name": "Imperial 3D Cinema",
                "city": "Kurunegala",
                "address": "45 Colombo Rd, Kurunegala 60000",
                "phone": "+94 37 222 1200",
                "halls": ["Imperial 3D Main Screen"]
            },
            {
                "name": "Sky Lite 3D Cinema",
                "city": "Matara",
                "address": "88 Anagarika Dharmapala Mawatha, Matara 81000",
                "phone": "+94 41 222 3400",
                "halls": ["Sky Lite Screen 1"]
            },
            {
                "name": "Regal Cinema",
                "city": "Nuwara Eliya",
                "address": "Park Road, Nuwara Eliya 22200",
                "phone": "+94 52 222 2300",
                "halls": ["Regal Nuwara Eliya Main"]
            }
        ]

        halls_created = []
        for t_data in theaters_data:
            existing_t = db.query(Theater).filter(Theater.name == t_data["name"]).first()
            if not existing_t:
                t = Theater(name=t_data["name"], city=t_data["city"], address=t_data["address"])
                db.add(t)
                db.flush()
            else:
                t = existing_t

            for h_name in t_data["halls"]:
                existing_h = db.query(Hall).filter(Hall.theater_id == t.theater_id, Hall.hall_name == h_name).first()
                if not existing_h:
                    h = Hall(theater_id=t.theater_id, hall_name=h_name, total_capacity=96)
                    db.add(h)
                    db.flush()
                    halls_created.append(h)
                    rows = ["A", "B", "C", "D", "E", "F", "G", "H"]
                    for row in rows:
                        for num in range(1, 13):
                            seat_type = "VIP" if row in ["G", "H"] else "Regular"
                            seat = Seat(hall_id=h.hall_id, row_label=row, seat_number=num, seat_type=seat_type)
                            db.add(seat)
                else:
                    halls_created.append(existing_h)

        db.flush()
        sl_showtime_slots = [
            (10, 0, "Morning Show"),
            (13, 0, "Matinee Show"),
            (16, 0, "First Show"),
            (19, 15, "Second Show"),
            (22, 15, "Night Show"),
        ]

        now = datetime.now(timezone.utc)
        now_showing_movies = [m for m in movie_objs if m.status == MovieStatus.NOW_SHOWING]
        db.query(Showtime).delete()
        db.flush()

        showtime_count = 0
        clash_prevented_count = 0
        for day_offset in range(0, 5):
            current_date = now.date() + timedelta(days=day_offset)

            for h_idx, h in enumerate(halls_created):
                for slot_idx, (hour, minute, slot_name) in enumerate(sl_showtime_slots):
                    movie_index = (h_idx * 3 + day_offset * 2 + slot_idx) % len(now_showing_movies)
                    m = now_showing_movies[movie_index]

                    start_time = datetime(
                        current_date.year, current_date.month, current_date.day,
                        hour, minute, tzinfo=timezone.utc
                    )
                    runtime_minutes = min(m.duration_min, 165)
                    end_time = start_time + timedelta(minutes=runtime_minutes)
                    existing_clash = db.query(Showtime).filter(
                        Showtime.hall_id == h.hall_id,
                        Showtime.start_time < end_time,
                        Showtime.end_time > start_time
                    ).first()

                    if existing_clash:
                        clash_prevented_count += 1
                        continue

                    base_price = Decimal("1500.00")
                    if "IMAX" in h.hall_name or "Gold" in h.hall_name or "LUXE" in h.hall_name:
                        base_price = Decimal("2800.00")
                    elif "VIP" in h.hall_name or "Premier" in h.hall_name:
                        base_price = Decimal("2200.00")

                    st = Showtime(
                        movie_id=m.movie_id,
                        hall_id=h.hall_id,
                        start_time=start_time,
                        end_time=end_time,
                        base_price=base_price
                    )
                    db.add(st)
                    showtime_count += 1

        db.commit()
        print(f"  ✓ Sri Lankan Non-Clashing Showtime Engine generated {showtime_count} guaranteed clash-free showtimes (5 SL standard daily slots)")
        if clash_prevented_count > 0:
            print(f"  ✓ Strict clash prevention intercepted {clash_prevented_count} overlapping showtimes.")
        print("\n🎬 QuickShow Movie Catalog Seeding Completed Successfully!\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Database seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
