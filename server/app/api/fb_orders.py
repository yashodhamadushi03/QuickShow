from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal

from app.core.database import get_db
from app.models.user import User
from app.models.booking import Booking
from app.models.fb_order import FBOrder, FBOrderStatus
from app.schemas.fb_order import FBOrderCreate, FBOrderOut
from app.api.deps import get_current_user_optional, get_current_admin

router = APIRouter(prefix="", tags=["Food & Beverage (Concessions)"])
STANDARD_FB_MENU = [
    {
        "id": "FB-01",
        "name": "Jumbo Caramel Popcorn Combo",
        "category": "Popcorn",
        "price_lkr": 850.00,
        "description": "Sweet crunchy freshly popped jumbo caramel popcorn bucket.",
        "image": "https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400"
    },
    {
        "id": "FB-02",
        "name": "Salted Butter Popcorn Regular",
        "category": "Popcorn",
        "price_lkr": 650.00,
        "description": "Classic warm cinema popcorn smothered in melted butter.",
        "image": "https://images.unsplash.com/photo-1585647347384-2593bc35786b?q=80&w=400"
    },
    {
        "id": "FB-03",
        "name": "Loaded Cheese Nachos & Salsa",
        "category": "Snacks",
        "price_lkr": 950.00,
        "description": "Crispy corn tortilla chips with warm jalapeño cheese sauce & tangy salsa.",
        "image": "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?q=80&w=400"
    },
    {
        "id": "FB-04",
        "name": "Blockbuster Duo Snack Combo",
        "category": "Combos",
        "price_lkr": 1600.00,
        "description": "1 Large Caramel Popcorn + 2 Soft Drinks (500ml) + Sweet Dip.",
        "image": "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?q=80&w=400"
    },
    {
        "id": "FB-05",
        "name": "Jumbo Family Concession Pack",
        "category": "Combos",
        "price_lkr": 2800.00,
        "description": "2 Large Popcorn Buckets + Loaded Nachos + 3 Beverages.",
        "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400"
    },
    {
        "id": "FB-06",
        "name": "Coca-Cola Zero 500ml",
        "category": "Beverages",
        "price_lkr": 350.00,
        "description": "Chilled fountain Coca-Cola Zero Sugar.",
        "image": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400"
    },
    {
        "id": "FB-07",
        "name": "Sprite Chilled 500ml",
        "category": "Beverages",
        "price_lkr": 350.00,
        "description": "Refreshing lemon-lime carbonated soda.",
        "image": "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?q=80&w=400"
    },
    {
        "id": "FB-08",
        "name": "Classic Chicken Hot Dog",
        "category": "Snacks",
        "price_lkr": 750.00,
        "description": "Grilled premium chicken sausage in warm bun with mustard & ketchup.",
        "image": "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?q=80&w=400"
    }
]

@router.get("/f-b/menu")
def get_concession_menu():
    """Returns the official cinema Food & Beverage (F&B) menu catalog."""
    return STANDARD_FB_MENU

@router.get("/f-b/orders", response_model=List[FBOrderOut])
def get_user_fb_orders(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Retrieve Food & Beverage orders for current user."""
    user_id = current_user.user_id if current_user else 1
    return db.query(FBOrder).filter(FBOrder.user_id == user_id).order_by(FBOrder.created_at.desc()).all()

@router.post("/f-b/orders", response_model=FBOrderOut, status_code=status.HTTP_201_CREATED)
def create_fb_order(
    order_in: FBOrderCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Place a new Food & Beverage concession order."""
    user_id = current_user.user_id if current_user else 1
    if order_in.booking_id:
        booking = db.query(Booking).filter(Booking.booking_id == order_in.booking_id).first()
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    calc_total = order_in.total_price or (Decimal(order_in.unit_price) * Decimal(order_in.quantity))

    order = FBOrder(
        booking_id=order_in.booking_id,
        user_id=user_id,
        item_name=order_in.item_name,
        quantity=order_in.quantity,
        unit_price=order_in.unit_price,
        total_price=calc_total,
        status=order_in.status or FBOrderStatus.CONFIRMED
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

@router.get("/admin/f-b/orders", response_model=List[FBOrderOut])
def get_admin_fb_orders(
    status_filter: Optional[FBOrderStatus] = Query(None, description="Filter by order status"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: List all customer concession orders across theaters."""
    query = db.query(FBOrder)
    if status_filter:
        query = query.filter(FBOrder.status == status_filter)
    return query.order_by(FBOrder.created_at.desc()).all()

@router.put("/admin/f-b/orders/{order_id}", response_model=FBOrderOut)
def update_admin_fb_order_status(
    order_id: int,
    new_status: FBOrderStatus,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Update status of a concession order (e.g., Delivered, Served, Cancelled)."""
    order = db.query(FBOrder).filter(FBOrder.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="F&B order not found.")
    order.status = new_status
    db.commit()
    db.refresh(order)
    return order

@router.delete("/admin/f-b/orders/{order_id}", status_code=status.HTTP_200_OK)
def delete_admin_fb_order(
    order_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Cancel and safely delete a concession order."""
    order = db.query(FBOrder).filter(FBOrder.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="F&B order not found.")
    db.delete(order)
    db.commit()
    return {"status": "success", "message": f"Concession order {order_id} removed successfully."}
