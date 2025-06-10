from pydantic import BaseModel, Field
from typing import Optional, List, Tuple
from datetime import datetime

# Для GeoJSON-подобного представления геометрии
class GeometryPoint(BaseModel):
    type: str = "Point"
    coordinates: Tuple[float, float] # (longitude, latitude)

class UserObjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    object_type: Optional[str] = None

class UserObjectCreate(UserObjectBase):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

class UserObject(UserObjectBase):
    id: int
    geom: GeometryPoint
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True # Позволяет Pydantic работать с SQLAlchemy моделями