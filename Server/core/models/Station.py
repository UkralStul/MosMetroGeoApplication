from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column, String, Index, Boolean
from geoalchemy2 import Geometry
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Station(Base):
    __tablename__ = 'stations'

    name_station = Column(String)
    name_line = Column(String)
    type: Mapped[str] = mapped_column(String(10), nullable=True)
    properties_data = Column(JSONB, nullable=True)
    geometry = Column(Geometry('POINT', srid=4326))
    __table_args__ = (
        Index('idx_stations_geom', geometry, postgresql_using='gist'),
    )