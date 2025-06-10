from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column, String, Index
from geoalchemy2 import Geometry
from .base import Base


class Station(Base):
    __tablename__ = 'stations'

    name_station = Column(String)
    name_line = Column(String)
    station_type = Column(String)
    properties_data = Column(JSONB, nullable=True)
    geometry = Column(Geometry('POINT', srid=4326))

    __table_args__ = (
        Index('idx_stations_geom', geometry, postgresql_using='gist'),
    )