from sqlalchemy import Column, Integer, Numeric, String, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base
from app.core.timezone import get_local_now


class PaymentStatus(str, enum.Enum):
    SUCCESS = "Success"
    FAILED = "Failed"
    PENDING = "Pending"


class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.booking_id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(50), nullable=False)  # e.g., 'Card', 'UPI', 'NetBanking', 'PayPal'
    status = Column(Enum(PaymentStatus, values_callable=lambda obj: [e.value for e in obj]), default=PaymentStatus.PENDING, nullable=False)
    transaction_reference = Column(String(100), unique=True, nullable=False)
    is_sandbox = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=get_local_now, nullable=False)

    # Relationships
    booking = relationship("Booking", back_populates="payment")
