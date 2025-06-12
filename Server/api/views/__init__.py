from fastapi import APIRouter

from .geo_objects import router as geo_router


router = APIRouter(prefix="/v1")

router.include_router(geo_router)
