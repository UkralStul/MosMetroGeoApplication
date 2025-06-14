import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {MapContainer, TileLayer, GeoJSON, useMap, useMapEvents, Marker} from 'react-leaflet';
import L, { PointExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/styles';
import { Polyline } from 'react-leaflet';

// Исправление для иконок Leaflet в React
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import busStopIcon from '@/assets/bus-stop.png';
import metroIcon from '@/assets/metro-station.png';
import locomotiveIcon from '@/assets/locomotive.png';
import districtIcon from '@/assets/district-icon.png';
import streetIcon from '@/assets/street-icon.png';
import markerIcon from '@/assets/marker-icon.png';

import { useUserObjectsStore } from '@/features/DisplayUserObjects/model/useUserObjectsStore';
import { GeoObjectType } from '@/shared/api/objectsApi';
import {GeoJsonFeatureCollection, GeoJsonFeature, UserObject} from '@/entities/MapObject/model/types';
import { MOSCOW_CENTER_COORDS, INITIAL_ZOOM_LEVEL } from '@/shared/config/mapConfig';
import styles from './MapWidget.module.css';
import { ObjectProperties } from '@/widgets/ObjectInfoSidebar/ObjectInfoSidebar';
import MarkerClusterGroup from "react-leaflet-markercluster";
// Fix для иконок Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

const layerInfo = {
    districts: { iconSrc: districtIcon, label: 'Районы' },
    bus_stops: { iconSrc: busStopIcon, label: 'Остановки' },
    stations: { iconSrc: locomotiveIcon, label: 'Станции' },
    streets: { iconSrc: streetIcon, label: 'Улицы' },
    custom_objects: { iconSrc: markerIcon, label: 'Мои Объекты' },
};
type LayerInfoKey = keyof typeof layerInfo;

interface MapWidgetProps {
    onMapClick: (latlng: L.LatLng) => void;
    isAddingMode: boolean;
    selectedCoords: { lat: number; lng: number }[];
    onFeatureClick: (properties: ObjectProperties) => void;
}

interface StaticLayerDisplayProps {
    data: GeoJsonFeatureCollection | null;
    layerNameKey: string;
    isVisible: boolean;
    onFeatureClick: (properties: ObjectProperties) => void;
}

// Вспомогательный компонент для обработки кликов на карте и изменения курсора
const MapEventsHandler: React.FC<{
    onClick: (latlng: L.LatLng) => void;
    isAddingMode: boolean
    onMouseMove?: (latlng: L.LatLng) => void;
    onMouseOut?: () => void;
}> = ({ onClick, isAddingMode, onMouseMove, onMouseOut }) => {
    const map = useMap();

    useEffect(() => {
        const mapContainer = map.getContainer();
        if (isAddingMode) {
            L.DomUtil.addClass(mapContainer, styles.mapAddingMode);
        } else {
            L.DomUtil.removeClass(mapContainer, styles.mapAddingMode);
        }
        return () => { L.DomUtil.removeClass(mapContainer, styles.mapAddingMode); };
    }, [isAddingMode, map]);

    useMapEvents({
        click(e) { onClick(e.latlng); },
        mousemove(e) { onMouseMove?.(e.latlng); },
        mouseout() { onMouseOut?.(); },
    });
    return null;
};


const StaticLayerDisplay: React.FC<StaticLayerDisplayProps> = React.memo(({ data, layerNameKey, isVisible, onFeatureClick }) => {
    if (!data || !isVisible) return null;

    const getStyle = (feature?: GeoJsonFeature) => {
        if (!feature?.geometry) return { color: '#3388ff' };
        switch (layerNameKey) {
            case 'districts': return { color: 'rgba(0, 100, 255, 0.7)', weight: 1, fillOpacity: 0.15, fillColor: 'rgba(0, 100, 255, 0.5)' };
            case 'streets': return { color: '#00cc66', weight: 2.5, opacity: 0.7 };
            default: return { color: '#3388ff', weight: 2 };
        }
    };

    const onEachFeature = (feature: GeoJsonFeature, layer: L.Layer) => {
        if (feature.properties) {
            layer.on({
                click: () => {
                    onFeatureClick(feature.properties);
                }
            });
        }
    };

    const pointToLayer = (feature: GeoJsonFeature, latlng: L.LatLng): L.Layer => {
        let iconUrl: string = '';
        let iconSize: PointExpression = [20, 20];
        const p = feature.properties;

        switch (layerNameKey) {
            case 'bus_stops':
                iconUrl = busStopIcon;
                iconSize = [15, 15];
                break;
            case 'stations':
                if (p?.type === 'М') {
                    iconUrl = metroIcon;
                    iconSize = [18, 18];
                } else {
                    iconUrl = locomotiveIcon;
                    iconSize = [15, 15];
                }
                break;
            default: return L.marker(latlng);
        }

        const customIcon = L.icon({
            iconUrl: iconUrl, iconSize: iconSize, iconAnchor: [iconSize[0]/2, iconSize[1]/2]
        });
        return L.marker(latlng, { icon: customIcon });
    };

    const isPointLayer = data.features.length > 0 && data.features[0].geometry.type === 'Point';

    return (
        <GeoJSON
            key={`${layerNameKey}-${isVisible}`}
            data={data}
            style={getStyle}
            onEachFeature={onEachFeature}
            {...(isPointLayer && { pointToLayer: pointToLayer })}
        />
    );
});
StaticLayerDisplay.displayName = 'StaticLayerDisplay';

// Пороги зума для слоев
const LAYER_ZOOM_THRESHOLDS: Record<string, { minZoom?: number; maxZoom?: number }> = {
    districts: { minZoom: 7, maxZoom: 13 },
    bus_stops: { minZoom: 14 },
    stations: { minZoom: 12 },
    streets: { minZoom: 15 },
    custom_objects: {minZoom: 1},
};

const MapWidget: React.FC<MapWidgetProps> = ({ onMapClick, isAddingMode, selectedCoords, onFeatureClick }) => {
    const [staticLayersData, setStaticLayersData] = useState<Record<string, GeoJsonFeatureCollection | null>>({});
    const [isLoadingStatic, setIsLoadingStatic] = useState(true);
    const { objectsByType, fetchObjectsByType, isLoading: isLoadingDynamic, updateCounter } = useUserObjectsStore();
    const [cursorPosition, setCursorPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
        bus_stops: false, districts: false, stations: false, streets: false, custom_objects: true,
    });
    const [currentZoom, setCurrentZoom] = useState<number>(INITIAL_ZOOM_LEVEL);

    useEffect(() => {
        const loadAllData = async () => {
            setIsLoadingStatic(true);
            const staticLayerFileMap: Record<string, string[]> = {
                bus_stops: ['bus_tram_stops.geojson'],
                districts: ['districts_layer.geojson'],
                stations: ['mcd_station.geojson', 'mck_station.geojson', 'metro_station.geojson'], // <-- ОБЪЕДИНЯЕМ ВСЕ СТАНЦИИ
                streets: ['StreetsPedestrian.geojson'],
            };

            const loadedData: Record<string, GeoJsonFeatureCollection | null> = {};

            for (const [layerKey, fileNames] of Object.entries(staticLayerFileMap)) {
                const allFeatures: GeoJsonFeature[] = [];
                for (const fileName of fileNames) {
                    try {
                        const response = await fetch(`/data/${fileName}`);
                        if (!response.ok) throw new Error(`Failed to load ${fileName}`);
                        const data: GeoJsonFeatureCollection = await response.json();
                        allFeatures.push(...data.features);
                    } catch (error) {
                        console.error(`Error loading ${fileName}:`, error);
                    }
                }
                // Создаем единую коллекцию для слоя
                if (allFeatures.length > 0) {
                    loadedData[layerKey] = {
                        type: "FeatureCollection",
                        features: allFeatures
                    };
                }
            }
            setStaticLayersData(loadedData);
            setIsLoadingStatic(false);

            const dynamicTypesToFetch: GeoObjectType[] = ['custom_objects', 'bus_stops', 'stations', 'districts', 'streets'];
            dynamicTypesToFetch.forEach(type => fetchObjectsByType(type));
        };

        loadAllData();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { layersToRender, customObjectsToRender } = useMemo(() => {
        const layers: Record<string, GeoJsonFeatureCollection> = {};
        let customObjects: UserObject[] = [];

        const allLayerKeys: GeoObjectType[] = ['bus_stops', 'districts', 'stations', 'streets', 'custom_objects'];

        for (const key of allLayerKeys) {
            if (key === 'custom_objects') {
                customObjects = objectsByType[key] || [];
                continue;
            }

            const staticData = staticLayersData[key];
            const dynamicData = objectsByType[key];

            const dynamicFeatures: GeoJsonFeature[] = (dynamicData || []).map(obj => ({
                type: "Feature", geometry: obj.geometry, properties: obj,
            }));

            const allFeatures = [...(staticData?.features || []), ...dynamicFeatures];

            if (allFeatures.length > 0) {
                layers[key] = { type: "FeatureCollection", features: allFeatures };
            }
        }
        return { layersToRender: layers, customObjectsToRender: customObjects };
    }, [staticLayersData, objectsByType]);

    const customObjectMarkers = useMemo(() => {
        return customObjectsToRender.map((obj) => (
            <Marker
                key={`custom-${obj.id}`}
                position={[obj.geometry.coordinates[1], obj.geometry.coordinates[0]]}
                // Можно использовать стандартную иконку или кастомную
                icon={L.icon({ iconUrl: iconUrl, iconSize: [25, 41], iconAnchor: [12, 41] })}
                eventHandlers={{
                    click: () => {
                        onFeatureClick(obj as ObjectProperties);
                    }
                }}
            >
            </Marker>
        ));
    }, [customObjectsToRender, onFeatureClick]);

    const toggleLayer = (layerName: string) => {
        setActiveLayers(prev => ({ ...prev, [layerName]: !prev[layerName] }));
    };

    const isLayerVisibleAtCurrentZoom = useCallback((layerNameKey: string): boolean => {
        if (!activeLayers[layerNameKey]) return false;
        const thresholds = LAYER_ZOOM_THRESHOLDS[layerNameKey];
        if (!thresholds) return true;
        const { minZoom, maxZoom } = thresholds;
        if (minZoom !== undefined && currentZoom < minZoom) return false;
        if (maxZoom !== undefined && currentZoom > maxZoom) return false;
        return true;
    }, [currentZoom, activeLayers]);

    // Внутренний компонент для отслеживания зума
    const ZoomDependentController = () => {
        const map = useMap();
        useEffect(() => {
            const handleZoomEnd = () => {
                setCurrentZoom(map.getZoom());
            };
            map.on('zoomend', handleZoomEnd);
            return () => {
                map.off('zoomend', handleZoomEnd);
            };
        }, [map]);
        return null;
    };

    return (
        <div className={styles.mapContainerWrapper}>
            <div className={styles.layerControlPanel}>
                {/* Итерируемся по нашему объекту `layerInfo` */}
                {Object.entries(layerInfo).map(([layerKey, { iconSrc, label }]) => {
                    const key = layerKey as LayerInfoKey;
                    const isActive = !!activeLayers[key];
                    const isDisabled = isLoadingStatic || isLoadingDynamic[key];

                    return (
                        <button
                            key={key}
                            className={`${styles.layerButton} ${isActive ? styles.active : ''}`}
                            onClick={() => toggleLayer(key)}
                            title={label}
                            disabled={isDisabled}
                        >
                            {isDisabled
                                ? '...'
                                : <img src={iconSrc} alt={label} className={styles.icon} />
                            }
                        </button>
                    );
                })}
            </div>
            <MapContainer
                center={MOSCOW_CENTER_COORDS}
                zoom={INITIAL_ZOOM_LEVEL}
                className={styles.map}
                attributionControl={false}
                maxBounds={[
                    [-90,-180],
                    [90, 180],
                ]}
                minZoom={5}
            >
                {isAddingMode && selectedCoords.length > 1 && (
                    <Polyline
                        positions={selectedCoords.map(coord => [coord.lat, coord.lng])}
                        pathOptions={{ color: 'blue', weight: 4 }}
                    />
                )}
                {isAddingMode && selectedCoords.length > 0 && cursorPosition && (
                    <Polyline
                        positions={[
                            [selectedCoords[selectedCoords.length - 1].lat, selectedCoords[selectedCoords.length - 1].lng],
                            [cursorPosition.lat, cursorPosition.lng]
                        ]}
                        pathOptions={{ color: 'gray', dashArray: '4', weight: 2 }}
                    />
                )}
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© OpenStreetMap'
                />
                <ZoomDependentController />
                <MapEventsHandler
                    onClick={onMapClick}
                    isAddingMode={isAddingMode}
                    onMouseMove={(latlng) => setCursorPosition({ lat: latlng.lat, lng: latlng.lng })}
                    onMouseOut={() => setCursorPosition(null)}
                />



                {Object.entries(layersToRender).map(([layerKey, data]) => (
                    <StaticLayerDisplay
                        key={`${layerKey}-${updateCounter}`}
                        data={data}
                        layerNameKey={layerKey}
                        isVisible={isLayerVisibleAtCurrentZoom(layerKey)}
                        onFeatureClick={onFeatureClick}
                    />
                ))}

                {isLayerVisibleAtCurrentZoom('custom_objects') && customObjectMarkers.length > 0 && (
                    <MarkerClusterGroup>
                        {customObjectMarkers}
                    </MarkerClusterGroup>
                )}
            </MapContainer>
        </div>
    );
};

export default MapWidget;