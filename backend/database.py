import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "mysql://mrrusssy_hawkmap:qwerty1z32c34c5!@mrrusssy.beget.tech/mrrusssy_hawkmap"

engine = create_engine(DATABASE_URL + "?charset=utf8mb4", pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()