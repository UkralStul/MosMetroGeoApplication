from core.models import Station
from ..schemas import StationCreate, StationUpdate
from .base import BaseCRUD

class CRUDStation(BaseCRUD[Station, StationCreate, StationUpdate]):
    pass

crud_station = CRUDStation(Station)