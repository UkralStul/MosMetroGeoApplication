from core.models import BusTramStop
from ..schemas import BusStopCreate, BusStopUpdate
from .base import BaseCRUD

class CRUDBusStop(BaseCRUD[BusTramStop, BusStopCreate, BusStopUpdate]):
    pass

crud_bus_stop = CRUDBusStop(BusTramStop)