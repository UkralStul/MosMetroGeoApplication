from fastapi import APIRouter
from .views import router as views_router

router = APIRouter()

router.include_router(router=views_router)