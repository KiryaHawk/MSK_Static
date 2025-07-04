from sqlalchemy import Column, Integer, String
from database import Base

class CommentColor(Base):
    __tablename__ = 'comments_colors'
    
    id = Column(Integer, primary_key=True, index=True)
    object_id = Column(String(50), unique=True, index=True)
    comment = Column(String(500), default="")
    color = Column(String(20), default="gray")