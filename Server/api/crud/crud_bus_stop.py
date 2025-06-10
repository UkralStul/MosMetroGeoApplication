from core.models import BusTramStop
from ..schemas import BusStopCreateAPI, BusStopUpdate
from .base import BaseCRUD

class CRUDBusStop(BaseCRUD[BusTramStop, BusStopCreateAPI, BusStopUpdate]):
    pass

crud_bus_stop = CRUDBusStop(BusTramStop)