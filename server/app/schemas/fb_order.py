from pydantic import BaseModel, ConfigDict
from typing import Optional
from decimal import Decimal
from datetime import datetime
from app.models.fb_order import FBOrderStatus


class FBOrderBase(BaseModel):
    item_name: str
    quantity: int = 1
    unit_price: Decimal
    total_price: Optional[Decimal] = None
    booking_id: Optional[int] = None
    status: Optional[FBOrderStatus] = FBOrderStatus.CONFIRMED


class FBOrderCreate(FBOrderBase):
    pass


class FBOrderOut(FBOrderBase):
    order_id: int
    user_id: int
    total_price: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
