"""
QuickShow Sri Lanka Timezone Utilities
--------------------------------------
Enforces Sri Lanka Standard Time (Asia/Colombo, UTC+5:30) across all
SQLAlchemy models, booking events, and API audit timestamps.
"""
from datetime import datetime, timezone, timedelta
SRI_LANKA_OFFSET = timedelta(hours=5, minutes=30)
SRI_LANKA_TZ = timezone(SRI_LANKA_OFFSET, name="Asia/Colombo")

def get_local_now() -> datetime:
    """
    Returns the current Sri Lanka local time (Asia/Colombo, UTC+5:30) as a naive datetime.
    MySQL DATETIME columns store naive datetimes; returning the local time directly ensures
    that rows viewed in MySQL Workbench and logs accurately reflect the real-world local time
    in Sri Lanka (e.g., October 29 at 02:30 AM, rather than lagging into October 28).
    """
    return datetime.now(SRI_LANKA_TZ).replace(tzinfo=None)

def get_local_now_with_tz() -> datetime:
    """Returns the current Sri Lanka local time with explicit timezone attached."""
    return datetime.now(SRI_LANKA_TZ)

def to_local_time(dt: datetime) -> datetime:
    """
    Converts a datetime into Sri Lanka local naive datetime.
    If the datetime is timezone-aware, converts to Asia/Colombo and drops tzinfo.
    """
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(SRI_LANKA_TZ).replace(tzinfo=None)
    return dt
