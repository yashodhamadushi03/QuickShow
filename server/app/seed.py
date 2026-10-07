from datetime import datetime, timedelta, date, timezone
from decimal import Decimal
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.movie import Movie, MovieStatus
from app.models.theater import Theater, Hall, Seat
from app.models.showtime import Showtime


def seed_database():
    print("🇱🇰 Initializing QuickShow Database Seeding with Sri Lankan Cinemas & Blockbusters...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Default Accounts
        admin_email = "admin@quickshow.lk"
        customer_email = "user@quickshow.lk"

        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                name="Scope Admin Sri Lanka",
                email=admin_email,
                password_hash=get_password_hash("admin123"),
                phone="+94771234567",
                role=UserRole.ADMIN
            )
            db.add(admin)
            print("  ✓ Created Sri Lankan Admin User: admin@quickshow.lk")

        customer = db.query(User).filter(User.email == customer_email).first()
        if not customer:
            customer = User(
                name="Kasun Perera",
                email=customer_email,
                password_hash=get_password_hash("user123"),
                phone="+94719876543",
                role=UserRole.CUSTOMER
            )
            db.add(customer)
            print("  ✓ Created Customer User: user@quickshow.lk")

        db.flush()

        # 2. Seed Movies (Sinhala, Tamil & English Blockbusters)
        movies_data = [
            {
                "title": "Dune: Part Two",
                "description": "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
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
                "description": "A poignant Sri Lankan cinema drama depicting love, resilience, and personal triumph across generations.",
                "genre": "Drama / Romance",
                "duration_min": 135,
                "language": "Sinhala",
                "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800",
                "rating": "U/A",
                "release_date": date(2024, 5, 10),
                "status": MovieStatus.NOW_SHOWING
            },
            {
                "title": "The Greatest Of All Time (GOAT)",
                "description": "An action-packed sci-fi thriller featuring dual roles and high-octane suspense across international missions.",
                "genre": "Action / Sci-Fi",
                "duration_min": 178,
                "language": "Tamil",
                "poster_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800",
                "rating": "U/A",
                "release_date": date(2024, 9, 5),
                "status": MovieStatus.NOW_SHOWING
            },
            {
                "title": "Oppenheimer",
                "description": "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
                "genre": "Biography / Drama",
                "duration_min": 180,
                "language": "English",
                "poster_url": "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800",
                "rating": "R",
                "release_date": date(2023, 7, 21),
                "status": MovieStatus.NOW_SHOWING
            },
            {
                "title": "Devara: Part 1",
                "description": "An epic action saga set against coastal lands, depicting coastal power struggles and legendary courage.",
                "genre": "Action / Drama",
                "duration_min": 170,
                "language": "Tamil",
                "poster_url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800",
                "rating": "U/A",
                "release_date": date(2024, 9, 27),
                "status": MovieStatus.COMING_SOON
            },
            {
                "title": "Joker: Folie à Deux",
                "description": "Arthur Fleck struggles with his dual identity while discovering love and music within Arkham State Hospital.",
                "genre": "Crime / Drama / Musical",
                "duration_min": 138,
                "language": "English",
                "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800",
                "rating": "R",
                "release_date": date(2024, 10, 4),
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
                movie_objs.append(existing_m)
        
        db.flush()
        print(f"  ✓ Seeded {len(movie_objs)} Movies (English, Sinhala & Tamil)")

        # 3. Seed Authentic Sri Lankan Cinema Theaters
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
                "halls": ["Screen 1 - IMAX 3D", "Screen 2 - Dolby Surround"]
            },
            {
                "name": "Liberty by Scope Cinemas",
                "city": "Colombo 03",
                "address": "35 R. A. De Mel Mawatha, Colpetty, Colombo 00300",
                "phone": "+94 11 232 5250",
                "halls": ["Cinema 1 - Main Auditorium", "Cinema 2 - VIP Suites"]
            },
            {
                "name": "Savoy 3D Dolby Atmos",
                "city": "Colombo 06",
                "address": "12 Galle Rd, Wellawatte, Colombo 00600",
                "phone": "+94 11 236 2200",
                "halls": ["Savoy 3D Hall 1", "Savoy Premier Lounge"]
            },
            {
                "name": "Savoy Metro",
                "city": "Maharagama",
                "address": "High Level Rd, Maharagama 10280",
                "phone": "+94 11 285 0200",
                "halls": ["Metro Screen 1", "Metro Screen 2"]
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

                    # Generate Seat Grid (Rows A to H, Seats 1 to 12 = 96 Seats per hall!)
                    rows = ["A", "B", "C", "D", "E", "F", "G", "H"]
                    for row in rows:
                        for num in range(1, 13):
                            seat_type = "VIP" if row in ["G", "H"] else "Regular"
                            seat = Seat(hall_id=h.hall_id, row_label=row, seat_number=num, seat_type=seat_type)
                            db.add(seat)
                else:
                    halls_created.append(existing_h)

        db.flush()
        print(f"  ✓ Seeded 5 Sri Lankan Cinema Theaters & Halls with Seat Matrix (Rows A-H x 12)")

        # 4. Seed Showtimes for Now Showing Movies
        now_showing_movies = [m for m in movie_objs if m.status == MovieStatus.NOW_SHOWING]
        now = datetime.now(timezone.utc)

        showtime_count = 0
        for m in now_showing_movies:
            for h in halls_created[:4]:  # Seed across halls
                for hours_offset in [3, 7, 27, 31]:
                    start_time = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=hours_offset)
                    end_time = start_time + timedelta(minutes=m.duration_min)
                    
                    existing_st = db.query(Showtime).filter(
                        Showtime.movie_id == m.movie_id,
                        Showtime.hall_id == h.hall_id,
                        Showtime.start_time == start_time
                    ).first()

                    if not existing_st:
                        st = Showtime(
                            movie_id=m.movie_id,
                            hall_id=h.hall_id,
                            start_time=start_time,
                            end_time=end_time,
                            base_price=Decimal("1500.00") if "Gold" not in h.hall_name else Decimal("2800.00")
                        )
                        db.add(st)
                        showtime_count += 1

        db.commit()
        print(f"  ✓ Seeded {showtime_count} Showtimes across Sri Lankan halls")
        print("\n🇱🇰 QuickShow Sri Lanka Database Seeding Completed Successfully!\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Database seeding failed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
