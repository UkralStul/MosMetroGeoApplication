from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column, String, Index
from geoalchemy2 import Geometry
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class District(Base):
    __tablename__ = 'districts'

    fid: Mapped[int] = mapped_column(unique=True, index=True, nullable=True)
    name = Column(String)
    name_ao = Column(String)
    properties_data = Column(JSONB, nullable=True)
    geometry = Column(Geometry('MULTIPOLYGON', srid=4326))

    __table_args__ = (
        Index('idx_districts_geom', geometry, postgresql_using='gist'),
    )