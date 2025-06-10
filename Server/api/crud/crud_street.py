from core.models import Street
from ..schemas import StreetCreateAPI, StreetUpdate
from .base import BaseCRUD

class CRUDStreet(BaseCRUD[Street, StreetCreateAPI, StreetUpdate]):
    pass

crud_street = CRUDStreet(Street)