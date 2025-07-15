from sqlalchemy import Column, Integer, String
from database import Base

class Point(Base):
    __tablename__ = 'points'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    latitude = Column(String)
    longitude = Column(String)
    
class CommentColor(Base):
    __tablename__ = "comments_colors"

    id = Column(Integer, primary_key=True, index=True)
    object_id = Column(String, unique=True, index=True)
    comment = Column(String)
    color = Column(String)