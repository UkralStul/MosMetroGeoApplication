from core.models import District
from ..schemas import DistrictCreate, DistrictUpdate
from .base import BaseCRUD

class CRUDDistrict(BaseCRUD[District, DistrictCreate, DistrictUpdate]):
    pass

crud_district = CRUDDistrict(District)