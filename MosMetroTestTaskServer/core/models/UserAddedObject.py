from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from geoalchemy2 import Geometry # pip install GeoAlchemy2
from .base import Base

class UserAddedObject(Base):
    __tablename__ = "user_added_objects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    object_type = Column(String(100))
    geom = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False) # SRID 4326 for WGS84
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())