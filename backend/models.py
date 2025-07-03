from sqlalchemy import Column, Integer, String
from database import Base

class Point(Base):
    __tablename__ = 'points'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    latitude = Column(String)
    longitude = Column(String)