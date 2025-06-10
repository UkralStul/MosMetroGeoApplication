from fiona import session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from shapely.geometry import Point # pip install Shapely
from geoalchemy2.shape import from_shape
from .schemas import UserObjectCreate, UserObject, GeometryPoint
from core.models import UserAddedObject
from shapely.wkb import loads


async def get_user_object(session: AsyncSession, object_id: int):
    stmt = select(UserAddedObject).filter_by(object_id=object_id)

    request = await session.execute(stmt)
    user_obj = request.scalars().first()

    if user_obj:
        return user_obj
    return None


async def get_user_objects(session: AsyncSession):
    stmt = select(UserAddedObject)

    request = await session.execute(stmt)
    user_objects = request.scalars().all()

    return user_objects

async def create_user_object(session: AsyncSession, obj_in: UserObjectCreate):
    # Преобразуем lat/lon в геометрию PostGIS POINT
    point_geom = Point(obj_in.longitude, obj_in.latitude)
    wkt_geom = f"SRID=4326;{point_geom.wkt}"

    user_obj = UserAddedObject(
        name=obj_in.name,
        description=obj_in.description,
        object_type=obj_in.object_type,
        geom=wkt_geom
    )

    session.add(user_obj)
    session.commit()
    session.refresh(user_obj)
    return user_obj

def convert_db_object_to_response_schema(db_obj: UserAddedObject) -> UserObject:
    """Helper to convert SQLAlchemy model to Pydantic schema with proper geometry."""
    shapely_point = loads(bytes(db_obj.geom.data)) # geom is WKBElement
    geom_data = GeometryPoint(coordinates=(shapely_point.x, shapely_point.y)) # lon, lat

    return UserObject(
        id=db_obj.id,
        name=db_obj.name,
        description=db_obj.description,
        object_type=db_obj.object_type,
        geom=geom_data,
        created_at=db_obj.created_at,
        updated_at=db_obj.updated_at
    )