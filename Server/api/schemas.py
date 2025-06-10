# schemas/geo_schemas.py
from geoalchemy2.shape import to_shape
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Any, Dict, Optional, List
from shapely.geometry import mapping
from geoalchemy2.elements import WKBElement


# Базовая схема для обработки геометрии
class GeoJSON(BaseModel):
    type: str
    coordinates: list


# Валидатор для преобразования WKBElement от GeoAlchemy2 в словарь GeoJSON
def transform_geometry(geom: Any) -> Optional[Dict[str, Any]]:
    if geom is None:
        return None

    if isinstance(geom, WKBElement):
        shapely_geom = to_shape(geom)
        return mapping(shapely_geom)

    if isinstance(geom, dict):
        return geom

    raise TypeError(f"Unsupported geometry type for transform: {type(geom)}")


# Простая базовая схема для связи с ORM
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class DistrictBase(BaseModel):
    name: Optional[str] = None
    name_ao: Optional[str] = None
    properties_data: Optional[Dict[str, Any]] = None


# Схема для СОЗДАНИЯ ЧЕРЕЗ API (без id)
class DistrictCreateAPI(DistrictBase):
    name: str
    name_ao: str
    geometry: GeoJSON


# Схема для ИМПОРТА ИЗ ФАЙЛА (с id)
class DistrictImport(DistrictCreateAPI):
    id: int


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


# Схема для СОЗДАНИЯ ЧЕРЕЗ API (без id)
class BusStopCreateAPI(BusStopBase):
    name_mpv: str
    geometry: GeoJSON


# Схема для ИМПОРТА ИЗ ФАЙЛА (с id)
class BusStopImport(BusStopCreateAPI):
    id: int


class BusStopUpdate(BusStopBase):
    geometry: Optional[GeoJSON] = None


class BusStopRead(BusStopBase, BaseSchema):
    id: int
    geometry: Optional[Dict[str, Any]] = None

    @field_validator("geometry", mode="before")
    @classmethod
    def to_geojson(cls, v: Any) -> Optional[Dict[str, Any]]:
        return transform_geometry(v)


# --- Схемы для Station ---
class StationBase(BaseModel):
    name_station: Optional[str] = None
    name_line: Optional[str] = None
    station_type: Optional[str] = None
    properties_data: Optional[Dict[str, Any]] = None


# Схема для СОЗДАНИЯ ЧЕРЕЗ API (без id, так как он всегда автоинкрементный)
class StationCreateAPI(StationBase):
    name_station: str
    geometry: GeoJSON


# Для станций схема импорта не нужна, так как id всегда генерируется БД
class StationUpdate(StationBase):
    geometry: Optional[GeoJSON] = None


class StationRead(StationBase, BaseSchema):
    id: int
    geometry: Optional[Dict[str, Any]] = None

    @field_validator("geometry", mode="before")
    @classmethod
    def to_geojson(cls, v: Any) -> Optional[Dict[str, Any]]:
        return transform_geometry(v)


# --- Схемы для Street ---
class StreetBase(BaseModel):
    st_name: Optional[str] = None
    road_categ: Optional[str] = None
    properties_data: Optional[Dict[str, Any]] = None


# Схема для СОЗДАНИЯ ЧЕРЕЗ API (без id)
class StreetCreateAPI(StreetBase):
    geometry: GeoJSON


# Схема для ИМПОРТА ИЗ ФАЙЛА (с id)
class StreetImport(StreetCreateAPI):
    id: int


class StreetUpdate(StreetBase):
    geometry: Optional[GeoJSON] = None


class StreetRead(StreetBase, BaseSchema):
    id: int
    geometry: Optional[Dict[str, Any]] = None

    @field_validator("geometry", mode="before")
    @classmethod
    def to_geojson(cls, v: Any) -> Optional[Dict[str, Any]]:
        return transform_geometry(v)