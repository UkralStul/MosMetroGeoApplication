from sqlalchemy import Column, String, Text, Index
from geoalchemy2 import Geometry
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base
from sqlalchemy.dialects.postgresql import JSONB

class BusTramStop(Base):
    __tablename__ = 'bus_tram_stops'

    fid: Mapped[int] = mapped_column(unique=True, index=True, nullable=True)
    name_mpv = Column(String)
    rayon = Column(String)
    ao = Column(String)
    address_mpv = Column(String)
    marshrut = Column(String)
    properties_data = Column(JSONB, nullable=True)
    geometry = Column(Geometry('POINT', srid=4326))

    __table_args__ = (
        Index('idx_bus_tram_stops_geom', geometry, postgresql_using='gist'),
    )