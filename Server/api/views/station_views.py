from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper
from api.crud import crud_station
from ..schemas import StationRead, StationCreateAPI, StationUpdate

router = APIRouter(prefix="/stations", tags=["Stations (Metro, MCC, MCD)"])

@router.post("/", response_model=StationRead, status_code=status.HTTP_201_CREATED)
async def create_station(
    station_in: StationCreateAPI,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Создать новую станцию (метро, МЦК, МЦД).
    """
    return await crud_station.create(db=session, obj_in=station_in)


@router.get("/", response_model=List[StationRead])
async def read_stations(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Получить список станций с пагинацией.
    """
    stations = await crud_station.get_multi(db=session, skip=skip, limit=limit)
    return stations


@router.get("/{station_id}", response_model=StationRead)
async def read_station_by_id(
    station_id: int,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Получить станцию по её ID.
    """
    station = await crud_station.get(db=session, id=station_id)
    if station is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station with id {station_id} not found",
        )
    return station

@router.put("/{station_id}", response_model=StationRead)
async def update_station(
    station_id: int,
    station_in: StationUpdate,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Обновить информацию о станции.
    """
    station = await crud_station.get(db=session, id=station_id)
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station with id {station_id} not found",
        )
    updated_station = await crud_station.update(db=session, db_obj=station, obj_in=station_in)
    return updated_station


@router.delete("/{station_id}", response_model=StationRead)
async def delete_station(
    station_id: int,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Удалить станцию.
    """
    station = await crud_station.remove(db=session, id=station_id)
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station with id {station_id} not found",
        )
    return station