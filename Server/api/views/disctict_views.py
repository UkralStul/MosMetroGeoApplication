from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import db_helper
from api.crud import crud_district
from ..schemas import DistrictRead, DistrictCreateAPI, DistrictUpdate

router = APIRouter(prefix="/districts", tags=["Districts"])

@router.post("/", response_model=DistrictRead, status_code=status.HTTP_201_CREATED)
async def create_district(
    district_in: DistrictCreateAPI,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    return await crud_district.create(db=session, obj_in=district_in)


@router.get("/", response_model=List[DistrictRead])
async def read_districts(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    return await crud_district.get_multi(db=session, skip=skip, limit=limit)


@router.get("/{district_id}", response_model=DistrictRead)
async def read_district_by_id(
    district_id: int,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    district = await crud_district.get(db=session, id=district_id)
    if district is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="District not found"
        )
    return district

@router.put("/{district_id}", response_model=DistrictRead)
async def update_district(
    district_id: int,
    district_in: DistrictUpdate,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    district = await crud_district.get(db=session, id=district_id)
    if not district:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="District not found"
        )
    return await crud_district.update(db=session, db_obj=district, obj_in=district_in)


@router.delete("/{district_id}", response_model=DistrictRead)
async def delete_district(
    district_id: int,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    district = await crud_district.remove(db=session, id=district_id)
    if not district:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="District not found"
        )
    return district