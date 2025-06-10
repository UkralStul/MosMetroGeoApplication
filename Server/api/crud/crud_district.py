from core.models import District
from ..schemas import DistrictCreateAPI, DistrictUpdate
from .base import BaseCRUD

class CRUDDistrict(BaseCRUD[District, DistrictCreateAPI, DistrictUpdate]):
    pass

crud_district = CRUDDistrict(District)