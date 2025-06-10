from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper
from api.crud import crud_street
from ..schemas import StreetRead, StreetCreateAPI, StreetUpdate

router = APIRouter(prefix="/streets", tags=["Streets"])

@router.post("/", response_model=StreetRead, status_code=status.HTTP_201_CREATED)
async def create_street(
    street_in: StreetCreateAPI,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Создать новую улицу.
    """
    # Проверяем, существует ли уже улица с таким ID, так как он не автоинкрементный
    existing_street = await crud_street.get(db=session, id=street_in.id)
    if existing_street:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Street with id {street_in.id} already exists",
        )
    return await crud_street.create(db=session, obj_in=street_in)


@router.get("/", response_model=List[StreetRead])
async def read_streets(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Получить список улиц с пагинацией.
    """
    streets = await crud_street.get_multi(db=session, skip=skip, limit=limit)
    return streets


@router.get("/{street_id}", response_model=StreetRead)
async def read_street_by_id(
    street_id: int,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Получить улицу по её ID (EdgeId).
    """
    street = await crud_street.get(db=session, id=street_id)
    if street is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Street with id {street_id} not found",
        )
    return street

@router.put("/{street_id}", response_model=StreetRead)
async def update_street(
    street_id: int,
    street_in: StreetUpdate,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Обновить информацию об улице.
    """
    street = await crud_street.get(db=session, id=street_id)
    if not street:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Street with id {street_id} not found",
        )
    updated_street = await crud_street.update(db=session, db_obj=street, obj_in=street_in)
    return updated_street


@router.delete("/{street_id}", response_model=StreetRead)
async def delete_street(
    street_id: int,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Удалить улицу.
    """
    street = await crud_street.remove(db=session, id=street_id)
    if not street:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Street with id {street_id} not found",
        )
    return street