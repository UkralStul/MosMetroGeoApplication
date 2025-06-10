from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper
from api.crud import crud_bus_stop
from ..schemas import BusStopRead, BusStopCreateAPI, BusStopUpdate

router = APIRouter(prefix="/bus_stops", tags=["Bus & Tram Stops"])

@router.post("/", response_model=BusStopRead, status_code=status.HTTP_201_CREATED)
async def create_bus_stop(
    stop_in: BusStopCreateAPI,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    return await crud_bus_stop.create(db=session, obj_in=stop_in)


@router.get("/", response_model=List[BusStopRead])
async def read_bus_stops(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    stops = await crud_bus_stop.get_multi(db=session, skip=skip, limit=limit)
    return stops


@router.get("/{stop_id}", response_model=BusStopRead)
async def read_bus_stop_by_id(
    stop_id: int,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    stop = await crud_bus_stop.get(db=session, id=stop_id)
    if stop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bus stop with id {stop_id} not found",
        )
    return stop

@router.put("/{stop_id}", response_model=BusStopRead)
async def update_bus_stop(
    stop_id: int,
    stop_in: BusStopUpdate,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    stop = await crud_bus_stop.get(db=session, id=stop_id)
    if not stop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bus stop with id {stop_id} not found",
        )
    updated_stop = await crud_bus_stop.update(db=session, db_obj=stop, obj_in=stop_in)
    return updated_stop


@router.delete("/{stop_id}", response_model=BusStopRead)
async def delete_bus_stop(
    stop_id: int,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    stop = await crud_bus_stop.remove(db=session, id=stop_id)
    if not stop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bus stop with id {stop_id} not found",
        )
    return stop