from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api import schemas
from core.models import db_helper
from .crud import create_user_object, convert_db_object_to_response_schema, get_user_object, get_user_objects


router = APIRouter(prefix="/api", tags=["api"])


@router.post("/objects/", response_model=schemas.UserObject)
async def create_object(obj_in: schemas.UserObjectCreate,
                  session: AsyncSession = Depends(db_helper.session_dependency),
):
    db_obj = await create_user_object(session=session, obj_in=obj_in)
    return convert_db_object_to_response_schema(db_obj)

@router.get("/objects/", response_model=List[schemas.UserObject])
async def read_objects(
        session: AsyncSession = Depends(db_helper.session_dependency)
):
    db_objects = await get_user_objects(session)
    return [convert_db_object_to_response_schema(obj) for obj in db_objects]

@router.get("/objects/{object_id}", response_model=schemas.UserObject)
async def read_object(
        object_id: int,
        session: AsyncSession = Depends(db_helper.session_dependency)
):
    db_obj = await get_user_object(session=session, object_id=object_id)
    if db_obj is None:
        raise HTTPException(status_code=404, detail="Object not found")
    return convert_db_object_to_response_schema(db_obj)

