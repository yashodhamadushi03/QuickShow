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
        
        # Genre Overlap
        genres1 = set([g.strip().lower() for g in movie1.genre.replace('/', ' ').split()])
        genres2 = set([g.strip().lower() for g in movie2.genre.replace('/', ' ').split()])
        overlap = len(genres1.intersection(genres2))
        if overlap > 0:
            score += overlap * 0.4

        # Language Match
        if movie1.language.lower() == movie2.language.lower():
            score += 0.3

        # Rating Match
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
        Evaluates acoustic sweet-spot (Rows D, E, F) and center viewing angles (Seats 5, 6, 7, 8).
        Selects top contiguous available seats.
        """
        available_seats = [s for s in seats if getattr(s, "status", "Available") == "Available"]
        if not available_seats:
            return []

        def rate_seat(s):
            # Prefer middle rows (D, E, F) and center seat numbers (5, 6, 7, 8)
            row_score = 10 if s.row_label in ["D", "E", "F"] else (8 if s.row_label in ["C", "G"] else 5)
            seat_num = s.seat_number
            center_score = 10 - abs(6.5 - seat_num)
            vip_bonus = 2 if s.seat_type == "VIP" else 0
            return row_score + center_score + vip_bonus

        # Sort available seats by sweet spot rating
        available_seats.sort(key=rate_seat, reverse=True)

        # Try to find contiguous seats in the same row
        rows_map = {}
        for s in available_seats:
            rows_map.setdefault(s.row_label, []).append(s)

        for row_label, row_seats in rows_map.items():
            row_seats.sort(key=lambda x: x.seat_number)
            for i in range(len(row_seats) - count + 1):
                subset = row_seats[i:i + count]
                # Check if contiguous
                if all(subset[j].seat_number + 1 == subset[j + 1].seat_number for j in range(count - 1)):
                    return [s.seat_id for s in subset]

        # Fallback to top rated individual seats
        return [s.seat_id for s in available_seats[:count]]
