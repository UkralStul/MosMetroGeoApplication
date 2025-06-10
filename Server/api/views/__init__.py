from fastapi import APIRouter

from .street_views import router as street_router
from .disctict_views import router as disctict_router
from .station_views import router as station_router
from .bus_stop_views import router as bus_stop_router


router = APIRouter(prefix="/v1")

router.include_router(bus_stop_router)
router.include_router(disctict_router)
router.include_router(station_router)
router.include_router(street_router)