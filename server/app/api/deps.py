from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole

security_scheme = HTTPBearer(auto_error=False)


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Extract current user if Bearer token present, else return None or default user."""
    if not credentials:
        return db.query(User).filter(User.role == UserRole.CUSTOMER).first()
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        return db.query(User).filter(User.role == UserRole.CUSTOMER).first()
        
    user_id_str: str = payload.get("sub")
    if not user_id_str:
        return db.query(User).filter(User.role == UserRole.CUSTOMER).first()
    
    try:
        user_id = int(user_id_str)
        user = db.query(User).filter(User.user_id == user_id).first()
        return user or db.query(User).filter(User.role == UserRole.CUSTOMER).first()
    except Exception:
        return db.query(User).filter(User.role == UserRole.CUSTOMER).first()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: Session = Depends(get_db)
) -> User:
    """Extract and authenticate current user from Bearer JWT token."""
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return user


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the authenticated user has the Admin role."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation restricted to Cinema Administrators",
        )
    return current_user
