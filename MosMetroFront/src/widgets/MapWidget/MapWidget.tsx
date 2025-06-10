import React, {useEffect, useState, useCallback, useMemo} from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import L, {PointExpression} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/styles';
import MarkerClusterGroup from 'react-leaflet-markercluster';

// Исправление для иконок Leaflet в React
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import busStopIcon from '@/assets/bus-stop.png'
import metroIcon from '@/assets/metro-station.png';
import locomotiveIcon from '@/assets/locomotive.png'

import { useUserObjectsStore } from '@/features/DisplayUserObjects/model/useUserObjectsStore';
import { UserObject, GeoJsonFeatureCollection, GeoJsonFeature } from '@/entities/MapObject/model/types';
import { MOSCOW_CENTER_COORDS, INITIAL_ZOOM_LEVEL } from '@/shared/config/mapConfig';
import styles from './MapWidget.module.css';

// Fix для иконок Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

interface MapWidgetProps {
    onMapClick: (latlng: L.LatLng) => void;
    isAddingMode: boolean;
}

// Вспомогательный компонент для обработки кликов на карте и изменения курсора
const MapEventsHandler: React.FC<{ onClick: (latlng: L.LatLng) => void; isAddingMode: boolean }> = ({ onClick, isAddingMode }) => {
    const map = useMap();

    useEffect(() => {
        if (isAddingMode) {
            L.DomUtil.addClass(map.getContainer(), styles.mapAddingMode);
        } else {
            L.DomUtil.removeClass(map.getContainer(), styles.mapAddingMode);
        }
        return () => {
            L.DomUtil.removeClass(map.getContainer(), styles.mapAddingMode);
        };
    }, [isAddingMode, map]);

    useMapEvents({
        click(e) {
            if (isAddingMode) {
                onClick(e.latlng);
            }
        },
    });
    return null;
};

// Мемоизированный компонент для отображения одного статического GeoJSON слоя
const StaticLayerDisplay: React.FC<{
    data: GeoJsonFeatureCollection | null;
    layerNameKey: string;
    isVisible: boolean;
}> = React.memo(({ data, layerNameKey, isVisible }) => {
    if (!data || !isVisible) return null;

    const getStyle = (feature?: GeoJsonFeature, layerKey?: string) => {
        const defaultStyle = { color: '#3388ff', weight: 2, opacity: 1, fillOpacity: 0.2 };
        if (!feature || !feature.geometry) return defaultStyle;
        const geomType = feature.geometry.type;

        switch (layerKey) {
            case 'districts_layer':
                return { color: 'rgba(0, 100, 255, 0.7)', weight: 1, opacity: 0.8, fillOpacity: 0.15, fillColor: 'rgba(0, 100, 255, 0.5)' };
            case 'StreetsPedestrian':
                return { color: '#00cc66', weight: 2.5, opacity: 0.7 };
            default:
                if (geomType === 'Polygon' || geomType === 'MultiPolygon') return { ...defaultStyle, color: '#ff7800', weight: 1.5 };
                if (geomType === 'LineString' || geomType === 'MultiLineString') return { ...defaultStyle, color: '#4CAF50', weight: 2.5 };
                return defaultStyle;
        }
    };

    const onEachFeature = (feature: GeoJsonFeature, layer: L.Layer) => {
        let popupContent = "Информация недоступна";
        if (feature.properties) {
            switch (layerNameKey) {
                case 'bus_tram_stops':
                    popupContent = `<b>Остановка:</b> ${feature.properties.name_mpv || 'Без имени'}`;
                    if (feature.properties.marshrut) popupContent += `<br/>Маршруты: ${feature.properties.marshrut}`;
                    break;
                case 'districts_layer':
                    popupContent = `<b>${feature.properties.NAME || 'Район без имени'}</b>`;
                    if (feature.properties.NAME_AO) popupContent += `<br/>Округ: ${feature.properties.NAME_AO}`;
                    break;
                case 'mcd_station': case 'mck_station': case 'metro_station':
                    popupContent = `<b>Станция:</b> ${feature.properties.name_station || 'Без имени'}`;
                    if (feature.properties.name_line) popupContent += `<br/>Линия: ${feature.properties.name_line}`;
                    break;
                case 'StreetsPedestrian':
                    popupContent = `<b>Улица:</b> ${feature.properties.ST_NAME || 'Без имени'}`;
                    break;
                default:
                    if (feature.properties.name) popupContent = String(feature.properties.name);
                    else if (feature.properties.Name) popupContent = String(feature.properties.Name);
            }
        }
        layer.bindPopup(popupContent);
    };

    const pointToLayer = (_feature: GeoJsonFeature, latlng: L.LatLng): L.Layer => {
        let iconUrl: string = '';
        let iconSize: PointExpression = [0,0];
        switch (layerNameKey) {
            case 'bus_tram_stops':
                iconUrl = busStopIcon;
                iconSize = [15,15]
                break;
            case 'metro_station':
                iconUrl = metroIcon;
                iconSize = [18,18]
                break;
            case 'mck_station':
                iconUrl = locomotiveIcon;
                iconSize = [15,15]
                break;
            case 'mcd_station':
                iconUrl = locomotiveIcon;
                iconSize = [15,15]
                break;
            default: return L.marker(latlng);
        }
        console.log(iconUrl);
        const customIcon = L.icon({
            iconUrl:  iconUrl,
            iconSize: iconSize,
            iconAnchor: [5, 5]
        });
        return L.marker(latlng, { icon: customIcon });
    };

    const isPointLayer = data.features.length > 0 && (data.features[0].geometry.type === 'Point' || data.features[0].geometry.type === 'MultiPoint');

    return (
        <GeoJSON
            key={`${layerNameKey}-${isVisible}`}
            data={data}
            style={(feature) => getStyle(feature, layerNameKey)}
            onEachFeature={onEachFeature}
            {...(isPointLayer && { pointToLayer: pointToLayer })}
        />
    );
});
StaticLayerDisplay.displayName = 'StaticLayerDisplay'; // Для лучшей отладки в React DevTools

// Пороги зума для слоев
const LAYER_ZOOM_THRESHOLDS: Record<string, { minZoom?: number; maxZoom?: number }> = {
    districts_layer: { minZoom: 7, maxZoom: 13 },
    bus_tram_stops: { minZoom: 14 },
    mcd_station: { minZoom: 12 },
    mck_station: { minZoom: 12 },
    metro_station: { minZoom: 12 },
    StreetsPedestrian: { minZoom: 15 },
};

const MapWidget: React.FC<MapWidgetProps> = ({ onMapClick, isAddingMode }) => {
    const { objects: userObjects, fetchObjects: fetchUserObjects, isLoading: isLoadingUserObjects } = useUserObjectsStore();

    const [staticLayersData, setStaticLayersData] = useState<Record<string, GeoJsonFeatureCollection | null>>({
        bus_tram_stops: null, districts_layer: null, mcd_station: null,
        mck_station: null, metro_station: null, StreetsPedestrian: null,
    });
    const [activeStaticLayers, setActiveStaticLayers] = useState<Record<string, boolean>>({
        bus_tram_stops: false, districts_layer: false, mcd_station: false,
        mck_station: false, metro_station: false, StreetsPedestrian: false,
    });
    const [isLoadingStatic, setIsLoadingStatic] = useState(true);
    const [currentZoom, setCurrentZoom] = useState<number>(INITIAL_ZOOM_LEVEL);
    const [showUserObjects, setShowUserObjects] = useState<boolean>(false);


    const toggleUserObjectsLayer = () => {
        setShowUserObjects(prev => !prev);
    };

    useEffect(() => {
        fetchUserObjects();
    }, [fetchUserObjects]);

    const userObjectMarkers = useMemo(() => {
        console.log("Recalculating userObjectMarkers"); // Для отладки, чтобы видеть, когда это происходит
        return userObjects.map((obj: UserObject) => (
            <Marker
                key={`user-${obj.id}`}
                position={[obj.geom.coordinates[1], obj.geom.coordinates[0]]}
            >
                <Popup>
                    <b>{obj.name}</b><br />
                    {obj.object_type && `Тип: ${obj.object_type}`}<br />
                    {obj.description && `Описание: ${obj.description}`}
                </Popup>
            </Marker>
        ));
    }, [userObjects]);

    useEffect(() => {
        const layerFileMap: Record<string, string> = {
            bus_tram_stops: 'bus_tram_stops.geojson', districts_layer: 'districts_layer.geojson',
            mcd_station: 'mcd_station.geojson', mck_station: 'mck_station.geojson',
            metro_station: 'metro_station.geojson', StreetsPedestrian: 'StreetsPedestrian.geojson',
        };
        const loadAllLayers = async () => {
            setIsLoadingStatic(true);
            const loadedData: Record<string, GeoJsonFeatureCollection | null> = {};
            for (const [layerKey, fileName] of Object.entries(layerFileMap)) {
                try {
                    const response = await fetch(`/data/${fileName}`);
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Failed to load ${fileName}: ${response.status} ${response.statusText}. Response: ${errorText.substring(0,100)}`);
                    }
                    const data = await response.json() as GeoJsonFeatureCollection;
                    loadedData[layerKey] = data;
                } catch (error) {
                    console.error(`Error loading ${fileName}:`, error);
                    loadedData[layerKey] = null;
                }
            }
            setStaticLayersData(loadedData);
            setIsLoadingStatic(false);
        };
        loadAllLayers();
    }, []);

    const toggleLayer = (layerName: string) => {
        setActiveStaticLayers(prev => ({ ...prev, [layerName]: !prev[layerName] }));
    };

    // Внутренний компонент для отслеживания событий карты, включая зум
    const ZoomDependentController = () => {
        const map = useMap();
        useEffect(() => {
            if(!map) return; // Добавлена проверка
            setCurrentZoom(map.getZoom()); // Устанавливаем начальный зум
            const handleZoomEnd = () => setCurrentZoom(map.getZoom());
            map.on('zoomend', handleZoomEnd);
            return () => {
                map.off('zoomend', handleZoomEnd);
            };
        }, [map]);
        return null;
    };

    const isLayerVisibleAtCurrentZoom = useCallback((layerNameKey: string): boolean => {
        if (!activeStaticLayers[layerNameKey]) return false;
        const thresholds = LAYER_ZOOM_THRESHOLDS[layerNameKey];
        if (!thresholds) return true;
        const { minZoom, maxZoom } = thresholds;
        if (minZoom !== undefined && currentZoom < minZoom) return false;
        if (maxZoom !== undefined && currentZoom > maxZoom) return false;
        return true;
    }, [currentZoom, activeStaticLayers]);

    return (
        <div className={styles.mapContainerWrapper}>
            <div className={styles.layerTogglePanel}>
                <h4>Слои карты</h4>
                {(isLoadingStatic || isLoadingUserObjects) && <p>Загрузка слоев...</p>}
                {Object.keys(staticLayersData).map(layerName => (
                    <div key={layerName} className={styles.layerItem}>
                        <input
                            type="checkbox"
                            id={`layer-toggle-${layerName}`}
                            checked={activeStaticLayers[layerName]}
                            onChange={() => toggleLayer(layerName)}
                            disabled={!staticLayersData[layerName]}
                        />
                        <label htmlFor={`layer-toggle-${layerName}`}>
                            {layerName.replace(/_/g, ' ')}
                            {LAYER_ZOOM_THRESHOLDS[layerName]?.minZoom && ` (z>${LAYER_ZOOM_THRESHOLDS[layerName].minZoom! -1})`}
                            {LAYER_ZOOM_THRESHOLDS[layerName]?.maxZoom && ` (z<${LAYER_ZOOM_THRESHOLDS[layerName].maxZoom! +1})`}
                        </label>
                    </div>
                ))}
                <div className={styles.layerItem}>
                    <input
                        type="checkbox"
                        id="userObjectsLayer"
                        checked={showUserObjects}
                        onChange={toggleUserObjectsLayer}
                    />
                    <label htmlFor="userObjectsLayer">Мои объекты</label>
                </div>
            </div>
            <MapContainer
                center={MOSCOW_CENTER_COORDS}
                zoom={INITIAL_ZOOM_LEVEL}
                className={styles.map}
                attributionControl={false}
                minZoom={5}
                maxBounds={[
                    [-90, -180],
                    [90, 180],
                ]}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    noWrap={true}
                />

                <ZoomDependentController />

                {Object.entries(staticLayersData).map(([layerKey, data]) => (
                    <StaticLayerDisplay
                        key={layerKey}
                        data={data}
                        layerNameKey={layerKey}
                        isVisible={isLayerVisibleAtCurrentZoom(layerKey)}
                    />
                ))}

                {showUserObjects && userObjects.length > 0 && (
                    <MarkerClusterGroup>
                        {userObjectMarkers} {/* Используем мемоизированный массив */}
                    </MarkerClusterGroup>
                )}

                <MapEventsHandler onClick={onMapClick} isAddingMode={isAddingMode} />
            </MapContainer>
        </div>
    );
};

export default MapWidget;