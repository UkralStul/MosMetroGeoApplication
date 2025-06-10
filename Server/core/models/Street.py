from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column, String, BigInteger, Index
from geoalchemy2 import Geometry
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase

from .base import Base

class Street(Base):
    __tablename__ = 'streets'

    fid: Mapped[int] = mapped_column(BigInteger, unique=True, index=True, nullable=True)
    st_name = Column(String, nullable=True)
    road_categ = Column(String, nullable=True)
    properties_data = Column(JSONB, nullable=True)
    geometry = Column(Geometry('MULTILINESTRING', srid=4326))

    __table_args__ = (
        Index('idx_streets_geom', geometry, postgresql_using='gist'),
    )