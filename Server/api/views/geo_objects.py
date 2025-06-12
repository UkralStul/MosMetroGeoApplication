# api/v1/geo_objects.py

from typing import List, Dict, Type, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from core.models import db_helper
from api.crud.base import BaseCRUD
from core.models import (
    BusTramStop, District, Station, Street, CustomObject
)
from api.crud import (
    crud_bus_stop, crud_district, crud_station, crud_street, crud_custom_object
)
from api.schemas import (
    BusStopRead, BusStopCreate, BusStopUpdate,
    DistrictRead, DistrictCreate, DistrictUpdate,
    StationRead, StationCreate, StationUpdate,
    StreetRead, StreetCreate, StreetUpdate,
    CustomObjectRead, CustomObjectCreate, CustomObjectUpdate,
)

router = APIRouter(prefix="/geo_objects", tags=["Generic Geo Objects"])

OBJECT_REGISTRY: Dict[str, tuple[BaseCRUD, Type[BaseModel], Type[BaseModel], Type[BaseModel], Type[BaseModel]]] = {
    "bus_stops": (crud_bus_stop, BusTramStop, BusStopRead, BusStopCreate, BusStopUpdate),
    "districts": (crud_district, District, DistrictRead, DistrictCreate, DistrictUpdate),
    "stations": (crud_station, Station, StationRead, StationCreate, StationUpdate),
    "streets": (crud_street, Street, StreetRead, StreetCreate, StreetUpdate),  # Для улиц своя Create схема с ID
    "custom_objects": (crud_custom_object, CustomObject, CustomObjectRead, CustomObjectCreate, CustomObjectUpdate),
}


def get_object_services(
        object_type: str = Path(..., description="Тип объекта, например, 'bus_stops' или 'custom_objects'")):
    """Зависимость, которая предоставляет нужные сервисы (CRUD, схемы) по типу объекта."""
    services = OBJECT_REGISTRY.get(object_type)
    if not services:
        raise HTTPException(status_code=404, detail=f"Object type '{object_type}' not found.")
    return services


# --- Универсальные эндпоинты ---

@router.post("/{object_type}/", status_code=status.HTTP_201_CREATED, summary="Создать новый гео-объект")
async def create_geo_object(
        object_data: Dict[str, Any],  # Принимаем сырой dict
        services: tuple = Depends(get_object_services),
        session: AsyncSession = Depends(db_helper.session_dependency),
):
    """
    Создает новый объект указанного типа.
    Тело запроса должно соответствовать схеме создания для данного типа объекта.
    """
    crud, _, ReadSchema, CreateSchema, _ = services
    try:
        # Валидируем данные с помощью Pydantic-схемы
        validated_data = CreateSchema.model_validate(object_data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Для улиц и кастомных объектов, где ID передается вручную, проверим на существование
    if hasattr(validated_data, 'id'):
        existing = await crud.get(db=session, id=validated_data.id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Object with id {validated_data.id} already exists in this layer."
            )

    new_obj = await crud.create(db=session, obj_in=validated_data)

    return ReadSchema.model_validate(new_obj)


@router.get("/{object_type}/", summary="Получить список гео-объектов")
async def read_geo_objects(
        services: tuple = Depends(get_object_services),
        session: AsyncSession = Depends(db_helper.session_dependency),
        skip: int = 0,
        limit: int = 100,
):
    crud, _, ReadSchema, _, _ = services
    items = await crud.get_multi(db=session, skip=skip, limit=limit)
    # Валидируем каждую запись для правильной сериализации
    return [ReadSchema.model_validate(item) for item in items]


@router.get("/{object_type}/{object_id}", summary="Получить гео-объект по ID")
async def read_geo_object_by_id(
        object_id: int,
        services: tuple = Depends(get_object_services),
        session: AsyncSession = Depends(db_helper.session_dependency),
):
    crud, _, ReadSchema, _, _ = services
    item = await crud.get(db=session, id=object_id)
    if not item:
        raise HTTPException(status_code=404, detail="Object not found")
    return ReadSchema.model_validate(item)


@router.put("/{object_type}/{object_id}", summary="Обновить гео-объект")
async def update_geo_object(
        object_id: int,
        object_data: Dict[str, Any],
        services: tuple = Depends(get_object_services),
        session: AsyncSession = Depends(db_helper.session_dependency),
):
    crud, _, _, _, UpdateSchema = services
    db_obj = await crud.get(db=session, id=object_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Object not found")

    try:
        update_data = UpdateSchema.model_validate(object_data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    return await crud.update(db=session, db_obj=db_obj, obj_in=update_data)


@router.delete("/{object_type}/{object_id}", summary="Удалить гео-объект")
async def delete_geo_object(
        object_id: int,
        services: tuple = Depends(get_object_services),
        session: AsyncSession = Depends(db_helper.session_dependency),
):
    crud, _, ReadSchema, _, _ = services
    deleted_obj = await crud.remove(db=session, id=object_id)
    if not deleted_obj:
        raise HTTPException(status_code=404, detail="Object not found")
    return ReadSchema.model_validate(deleted_obj)