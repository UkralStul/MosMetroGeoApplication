from core.models import Street
from ..schemas import StreetCreate, StreetUpdate
from .base import BaseCRUD

class CRUDStreet(BaseCRUD[Street, StreetCreate, StreetUpdate]):
    pass

crud_street = CRUDStreet(Street)