import logging
from typing import List
from sqlalchemy.orm import Session
from app.models.movie import Movie

logger = logging.getLogger("quickshow.ai")

class AIRecommendationEngine:
    @staticmethod
    def get_genre_similarity(movie1: Movie, movie2: Movie) -> float:
        """Calculate similarity score based on genre, language, and rating."""
        if movie1.movie_id == movie2.movie_id:
            return 0.0

        score = 0.0
        genres1 = set([g.strip().lower() for g in movie1.genre.replace('/', ' ').split()])
        genres2 = set([g.strip().lower() for g in movie2.genre.replace('/', ' ').split()])
        overlap = len(genres1.intersection(genres2))
        if overlap > 0:
            score += overlap * 0.4
        if movie1.language.lower() == movie2.language.lower():
            score += 0.3
        if movie1.rating and movie2.rating and movie1.rating == movie2.rating:
            score += 0.2

        return score

    @classmethod
    def recommend_similar_movies(cls, movie_id: int, db: Session, limit: int = 4) -> List[Movie]:
        """Returns top N recommended movies similar to a given target movie."""
        target = db.query(Movie).filter(Movie.movie_id == movie_id).first()
        if not target:
            return db.query(Movie).limit(limit).all()

        all_movies = db.query(Movie).filter(Movie.movie_id != movie_id).all()
        scored_movies = []

        for m in all_movies:
            sim = cls.get_genre_similarity(target, m)
            scored_movies.append((m, sim))

        scored_movies.sort(key=lambda x: x[1], reverse=True)
        return [m[0] for m in scored_movies[:limit]]

    @classmethod
    def recommend_best_seats(cls, seats: list, count: int = 2) -> list:
        """
        Smart Seat Optimizer Algorithm ("Best Seat in the House"):
        Real-world cinema acoustics & visual sweet-spot optimization:
        - Back Rows and Center-Back Tiers (Rows E, F, G, H) are designated as prime/VIP seats
          with optimal viewing angles (zero neck strain) and acoustic sweet spots.
        - Front Rows (Rows A, B) closest to the screen are designated as lower priority.
        - Center Seats (5, 6, 7, 8) in back/center rows receive highest recommendation weight.
        - Identifies top-rated contiguous seat blocks.
        """
        available_seats = [s for s in seats if getattr(s, "status", "Available") == "Available"]
        if not available_seats:
            return []

        def rate_seat(s):
            row = (s.row_label or "").upper()
            if row in ["E", "F"]:
                row_score = 20.0
            elif row in ["G", "H"]:
                row_score = 18.0
            elif row in ["C", "D"]:
                row_score = 10.0
            elif row in ["A", "B"]:
                row_score = 3.0
            else:
                row_score = 8.0
            seat_num = getattr(s, "seat_number", 6)
            center_score = 10.0 - abs(6.5 - seat_num)
            vip_bonus = 3.0 if getattr(s, "seat_type", "Regular") == "VIP" else 0.0

            return row_score + center_score + vip_bonus
        rows_map = {}
        for s in available_seats:
            rows_map.setdefault(s.row_label, []).append(s)
        best_block = None
        best_block_score = -1.0

        for row_label, r_seats in rows_map.items():
            r_seats.sort(key=lambda x: x.seat_number)
            for i in range(len(r_seats) - count + 1):
                subset = r_seats[i:i + count]
                is_contiguous = all(
                    subset[j].seat_number + 1 == subset[j + 1].seat_number
                    for j in range(count - 1)
                )
                if is_contiguous:
                    block_score = sum(rate_seat(seat) for seat in subset)
                    if block_score > best_block_score:
                        best_block_score = block_score
                        best_block = [seat.seat_id for seat in subset]

        if best_block:
            return best_block
        available_seats.sort(key=rate_seat, reverse=True)
        return [s.seat_id for s in available_seats[:count]]
