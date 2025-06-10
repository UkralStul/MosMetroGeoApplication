from core.models import Station
from ..schemas import StationCreateAPI, StationUpdate
from .base import BaseCRUD

class CRUDStation(BaseCRUD[Station, StationCreateAPI, StationUpdate]):
    pass

crud_station = CRUDStation(Station)