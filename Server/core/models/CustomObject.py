from sqlalchemy import Column, Index, String, Text, DateTime
from sqlalchemy.sql import func
from geoalchemy2 import Geometry # pip install GeoAlchemy2
from .base import Base

class CustomObject(Base):
    __tablename__ = "custom_objects"

    name = Column(String(255), nullable=False)
    description = Column(Text)
    object_type = Column(String(100))
    geometry = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('idx_custom_objects_geom', geometry, postgresql_using='gist'),
    )