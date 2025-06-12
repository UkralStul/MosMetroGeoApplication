from datetime import datetime

from geoalchemy2.shape import to_shape
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Any, Dict, Optional, List
from shapely.geometry import mapping
from geoalchemy2.elements import WKBElement


class GeoJSON(BaseModel):
    type: str
    coordinates: list


def transform_geometry(geom: Any) -> Optional[Dict[str, Any]]:
    if geom is None:
        return None

    if isinstance(geom, WKBElement):
        shapely_geom = to_shape(geom)
        return mapping(shapely_geom)

    if isinstance(geom, dict):
        return geom

    raise TypeError(f"Unsupported geometry type for transform: {type(geom)}")


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class DistrictBase(BaseModel):
    name: Optional[str] = None
    name_ao: Optional[str] = None
    properties_data: Optional[Dict[str, Any]] = None


class DistrictCreate(DistrictBase):
    name: str
    name_ao: str
    geometry: GeoJSON



class DistrictUpdate(DistrictBase):
    geometry: Optional[GeoJSON] = None


class DistrictRead(DistrictBase, BaseSchema):
    id: int
    geometry: Optional[Dict[str, Any]] = None

    @field_validator("geometry", mode="before")
    @classmethod
    def to_geojson(cls, v: Any) -> Optional[Dict[str, Any]]:
        return transform_geometry(v)


# --- Схемы для BusTramStop ---
class BusStopBase(BaseModel):
    name_mpv: Optional[str] = None
    rayon: Optional[str] = None
    ao: Optional[str] = None
    marshrut: Optional[str] = None
    properties_data: Optional[Dict[str, Any]] = None


class BusStopCreate(BusStopBase):
    name_mpv: str
    geometry: GeoJSON


class BusStopUpdate(BusStopBase):
    geometry: Optional[GeoJSON] = None


class BusStopRead(BusStopBase, BaseSchema):
    id: int
    geometry: Optional[Dict[str, Any]] = None

    @field_validator("geometry", mode="before")
    @classmethod
    def to_geojson(cls, v: Any) -> Optional[Dict[str, Any]]:
        return transform_geometry(v)


class StationBase(BaseModel):
    name_station: Optional[str] = None
    name_line: Optional[str] = None
    properties_data: Optional[Dict[str, Any]] = None


class StationCreate(StationBase):
    name_station: str
    geometry: GeoJSON
    type: str


class StationUpdate(StationBase):
    geometry: Optional[GeoJSON] = None


class StationRead(StationBase, BaseSchema):
    id: int
    geometry: Optional[Dict[str, Any]] = None
    type: Optional[str] = None

    @field_validator("geometry", mode="before")
    @classmethod
    def to_geojson(cls, v: Any) -> Optional[Dict[str, Any]]:
        return transform_geometry(v)


# --- Схемы для Street ---
class StreetBase(BaseModel):
    st_name: Optional[str] = None
    road_categ: Optional[str] = None
    properties_data: Optional[Dict[str, Any]] = None


class StreetCreate(StreetBase):
    geometry: GeoJSON


class StreetUpdate(StreetBase):
    geometry: Optional[GeoJSON] = None


class StreetRead(StreetBase, BaseSchema):
    id: int
    geometry: Optional[Dict[str, Any]] = None

    @field_validator("geometry", mode="before")
    @classmethod
    def to_geojson(cls, v: Any) -> Optional[Dict[str, Any]]:
        return transform_geometry(v)

# --- Схемы для CustomObject ---

class CustomObjectBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    object_type: Optional[str] = None

class CustomObjectCreate(CustomObjectBase):
    name: str
    geometry: GeoJSON


class CustomObjectUpdate(CustomObjectBase):
    geometry: Optional[GeoJSON] = None

# Схема для чтения объекта из БД
class CustomObjectRead(CustomObjectBase, BaseSchema):
    id: int
    name: str
    geometry: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    # Валидатор для преобразования геометрии в GeoJSON
    @field_validator("geometry", mode="before")
    @classmethod
    def to_geojson(cls, v: Any) -> Optional[Dict[str, Any]]:
        return transform_geometry(v)