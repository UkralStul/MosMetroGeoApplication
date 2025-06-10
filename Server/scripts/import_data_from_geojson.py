# load_data.py
import json
import os
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from shapely.geometry import shape
from sqlalchemy import text

# Импортируем асинхронный db_helper и модели
from core.models import Station, BusTramStop, District, Street, db_helper, Base


# Путь к папке с данными
DATA_DIR = '../geoData'


async def clear_data(db: AsyncSession):
    """Асинхронно очищает все данные из таблиц перед новой загрузкой."""
    print("Clearing old data...")
    # Поскольку у нас нет каскадного удаления, удаляем в порядке зависимостей
    # (хотя в данном случае они независимы)
    for table in reversed(Base.metadata.sorted_tables):
        await db.execute(table.delete())
    await db.commit()
    print("Old data cleared.")


async def load_geojson_features(db: AsyncSession, file_path: str, model_class, prop_mapper):
    """
    Универсальная асинхронная функция для загрузки данных из GeoJSON файла.

    :param db: Асинхронная сессия SQLAlchemy.
    :param file_path: Путь к GeoJSON файлу.
    :param model_class: Класс модели SQLAlchemy для создания объектов.
    :param prop_mapper: Функция для преобразования 'properties' из JSON в словарь для модели.
    """
    print(f"Loading data from {file_path} into {model_class}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {file_path}")
        return

    features = data.get('features', [])
    objects_to_add = []

    for feature in features:
        props = feature.get('properties', {})
        geom = feature.get('geometry')

        if not props or not geom:
            continue

        # Преобразуем геометрию в формат WKT
        wkt_geometry = f"SRID={4326};{shape(geom).wkt}"

        # Используем маппер для извлечения и преобразования свойств
        model_kwargs = prop_mapper(props)
        model_kwargs['geometry'] = wkt_geometry

        db_object = model_class(**model_kwargs)
        objects_to_add.append(db_object)

    if objects_to_add:
        # bulk_save_objects не является async, используем add_all
        db.add_all(objects_to_add)
        await db.commit()
        print(f"Successfully loaded {len(objects_to_add)} features from {file_path}.")
    else:
        print(f"No features to load from {file_path}.")


# --- Функции-мапперы для каждой модели (остаются без изменений) ---

def map_bus_stop_properties(props: dict) -> dict:
    return {
        'fid': props.get('fid'),
        'name_mpv': props.get('name_mpv'),
        'rayon': props.get('rayon'),
        'ao': props.get('ao'),
        'address_mpv': props.get('address_mpv'),
        'marshrut': props.get('marshrut'),
        'icon': props.get('icon'),
        'properties_data': props
    }


def map_district_properties(props: dict) -> dict:
    return {
        'fid': props.get('fid'),
        'name': props.get('NAME'),
        'name_ao': props.get('NAME_AO'),
        'properties_data': props
    }


def map_station_properties(props: dict) -> dict:
    station_type = props.get('type', 'Неизвестно')
    return {
        'name_station': props.get('name_station'),
        'name_line': props.get('name_line'),
        'station_type': station_type,
        'properties_data': props
    }


def map_street_properties(props: dict) -> dict:
    return {
        'fid': props.get('fid'),
        'st_name': props.get('ST_NAME'),
        'road_categ': props.get('ROAD_CATEG'),
        'properties_data': props
    }


async def init_db():
    """Асинхронно создает таблицы в базе данных."""
    async with db_helper.engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # Для полного сброса
        await conn.run_sync(Base.metadata.create_all)



async def main():
    """Главная асинхронная функция для выполнения всего процесса."""
    print("Initializing database schema...")
    await init_db()

    # Получаем сессию с помощью генератора зависимостей
    session_generator = db_helper.session_dependency()
    db: AsyncSession = await anext(session_generator)

    try:
        # Опционально: очистить таблицы перед загрузкой
        # Раскомментируйте, если нужно очищать данные при каждом запуске
        await clear_data(db)

        file_mapping = {
            'bus_tram_stops.geojson': (BusTramStop, map_bus_stop_properties),
            'districts_layer.geojson': (District, map_district_properties),
            'mcd_station.geojson': (Station, map_station_properties),
            'mck_station.geojson': (Station, map_station_properties),
            'metro_station.geojson': (Station, map_station_properties),
            'StreetsPedestrian.geojson': (Street, map_street_properties)
        }

        for filename, (model, mapper) in file_mapping.items():
            file_path = os.path.join(DATA_DIR, filename)
            await load_geojson_features(db, file_path, model, mapper)


    finally:
        await db.close()
        print("\nDatabase loading process finished.")


if __name__ == "__main__":
    # Запускаем асинхронную главную функцию
    print("Starting data loading script...")
    asyncio.run(main())