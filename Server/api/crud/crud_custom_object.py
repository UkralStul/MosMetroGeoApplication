from core.models import CustomObject
from ..schemas import CustomObjectCreate, CustomObjectUpdate
from .base import BaseCRUD

class CRUDCustomObject(BaseCRUD[CustomObject, CustomObjectCreate, CustomObjectUpdate]):
    pass

crud_custom_object = CRUDCustomObject(CustomObject)