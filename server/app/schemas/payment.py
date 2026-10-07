from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from decimal import Decimal
from typing import Optional
from app.models.payment import PaymentStatus


class PaymentCreate(BaseModel):
    booking_id: int
    payment_method: str = "Card / Instant Pay"
    customer_email: Optional[EmailStr] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None


class PaymentOut(BaseModel):
    payment_id: int
    booking_id: int
    amount: Decimal
    payment_method: str
    status: PaymentStatus
    transaction_reference: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
