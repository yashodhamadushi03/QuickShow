from datetime import datetime, timedelta, date, timezone
from decimal import Decimal
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.movie import Movie, MovieStatus
from app.models.theater import Theater, Hall, Seat
from app.models.showtime import Showtime


def seed_database():
    print("🚀 Initializing QuickShow Database Seeding...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Create Default Users
        admin_email = "admin@quickshow.com"
        customer_email = "user@quickshow.com"

        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                name="Cinema Administrator",
                email=admin_email,
                password_hash=get_password_hash("admin123"),
                phone="+15550192834",
                role=UserRole.ADMIN
            )
            db.add(admin)
            print("  ✓ Created Admin User: admin@quickshow.com (password: admin123)")

        customer = db.query(User).filter(User.email == customer_email).first()
        if not customer:
            customer = User(
                name="Jane Customer",
                email=customer_email,
                password_hash=get_password_hash("user123"),
                phone="+15550183742",
                role=UserRole.CUSTOMER
            )
            db.add(customer)
            print("  ✓ Created Customer User: user@quickshow.com (password: user123)")

        db.flush()

        # 2. Seed Movies
        movies_data = [
            {
                "title": "Avatar: The Way of Water",
                "description": "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora.",
                "genre": "Sci-Fi / Action",
                "duration_min": 192,
                "language": "English",
                "poster_url": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800",
                "rating": "PG-13",
                "release_date": date(2022, 12, 16),
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
                "title": "Deadpool & Wolverine",
                "description": "Wolverine is recovering from his injuries when he crosses paths with the loudmouth Deadpool.",
                "genre": "Action / Comedy",
                "duration_min": 127,
                "language": "English",
                "poster_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800",
                "rating": "R",
                "release_date": date(2024, 7, 26),
                "status": MovieStatus.COMING_SOON
            },
            {
                "title": "Joker: Folie à Deux",
                "description": "Struggling with his dual identity, Arthur Fleck not only stumbles upon true love, but also finds the music that's always been inside him.",
                "genre": "Crime / Musical / Drama",
                "duration_min": 138,
                "language": "English",
                "poster_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800",
                "rating": "R",
                "release_date": date(2024, 10, 4),
                "status": MovieStatus.COMING_SOON
            },
            {
                "title": "Gladiator II",
                "description": "Years after witnessing the death of the revered hero Maximus, Lucius enters the Colosseum after his home is conquered by tyrant emperors.",
                "genre": "Action / History",
                "duration_min": 150,
                "language": "English",
                "poster_url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800",
                "rating": "R",
                "release_date": date(2024, 11, 22),
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
        print(f"  ✓ Seeded {len(movie_objs)} Movies (Now Showing & Coming Soon)")

        # 3. Seed Theaters & Halls
        theaters_data = [
            {
                "name": "QuickShow Grand Cinema",
                "city": "New York",
                "address": "450 7th Ave, Manhattan, NY 10123",
                "halls": ["Screen 1 - IMAX", "Screen 2 - Dolby Atmos", "Screen 3 - VIP Luxe"]
            },
            {
                "name": "StarPlex Cinema Complex",
                "city": "Los Angeles",
                "address": "6801 Hollywood Blvd, Los Angeles, CA 90028",
                "halls": ["Hall A - Premium", "Hall B - Ultra HD"]
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
                    h = Hall(theater_id=t.theater_id, hall_name=h_name, total_capacity=50)
                    db.add(h)
                    db.flush()
                    halls_created.append(h)

                    # Generate Seat Grid (Rows A-E, Seats 1-10)
                    rows = ["A", "B", "C", "D", "E"]
                    for row in rows:
                        for num in range(1, 11):
                            seat_type = "VIP" if row in ["D", "E"] else "Regular"
                            seat = Seat(hall_id=h.hall_id, row_label=row, seat_number=num, seat_type=seat_type)
                            db.add(seat)
                else:
                    halls_created.append(existing_h)

        db.flush()
        print(f"  ✓ Seeded Theaters & Screening Halls with Seats Grid (Rows A-E x 10)")

        # 4. Seed Showtimes for Now Showing Movies
        now_showing_movies = [m for m in movie_objs if m.status == MovieStatus.NOW_SHOWING]
        now = datetime.now(timezone.utc)

        showtime_count = 0
        for m in now_showing_movies:
            for h in halls_created[:2]:  # Seed for first 2 halls
                for hours_offset in [2, 6, 26, 30]:
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
                            base_price=Decimal("14.50") if "IMAX" not in h.hall_name else Decimal("18.50")
                        )
                        db.add(st)
                        showtime_count += 1

        db.commit()
        print(f"  ✓ Seeded {showtime_count} Showtimes across cinema halls")
        print("\n🎉 QuickShow Database Seeding Completed Successfully!\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Database seeding failed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
