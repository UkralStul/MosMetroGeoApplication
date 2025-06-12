import React, { useState } from 'react';
import L from 'leaflet';
import MapWidget from '@/widgets/MapWidget/MapWidget';
import AddObjectForm from '@/widgets/AddObjectForm/AddObjectForm';
import AddObjSelectionForm from "@/widgets/AddObjSelectionForm/AddObjSelectionForm.tsx";
import { createObject, GeoObjectType } from '@/shared/api/objectsApi';
import styles from './MapPage.module.css';
import { useUserObjectsStore } from '@/features/DisplayUserObjects/model/useUserObjectsStore';


type Coords = { lat: number, lng: number };
const MapPage: React.FC = () => {
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<Coords[]>([]);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [selectionFormVisible, setSelectionFormVisible] = useState(false);
    const { fetchObjectsByType } = useUserObjectsStore();
    const [selectedObjType, setSelectedObjType] = useState<GeoObjectType | null>(null);
    const [clickCounter, setClickCounter] = useState<number>(0);

    const handleStartAddObject = () => {
        setSelectionFormVisible(prevState => !prevState);
        setSelectedCoords([]);
        setIsFormVisible(false);
    };

    const handleObjSelection = (objType: GeoObjectType) => {
        setSelectedObjType(objType as GeoObjectType);
        setSelectionFormVisible(false);
        setIsAddingMode(true);
    }

    const handleMapClick = (latlng: L.LatLng) => {
        if (isAddingMode) {
            setSelectedCoords(prevCoords => [...prevCoords, { lat: latlng.lat, lng: latlng.lng }]);

            setClickCounter(prevClickCount => {
                const newCount = prevClickCount + 1;

                if (
                    (selectedObjType === 'bus_stops' || selectedObjType === 'stations') &&
                    newCount === 1
                ) {
                    setIsAddingMode(false);
                    setIsFormVisible(true);
                    return 0;
                }

                if (selectedObjType === 'streets' && newCount === 2) {
                    setIsAddingMode(false);
                    setIsFormVisible(true);
                    return 0;
                }

                return newCount;
            });
        }
    };

    const handleFormSubmit = async (objectType: GeoObjectType, data: any) => {
        try {
            await createObject(objectType, data);

            alert('Объект успешно создан!');

            await fetchObjectsByType(objectType);

            setIsFormVisible(false);
            setIsAddingMode(false);
            setSelectedCoords([]);

        } catch (error) {
            console.error('Failed to create object:', error);
            alert('Ошибка при создании объекта. Подробности в консоли.');
        }
    };

    const handleFormCancel = () => {
        setIsFormVisible(false);
        setIsAddingMode(false);
        setSelectedCoords([]);
    };

    return (
        <div className={styles.mapPageContainer}>
            <div className={styles.controlsPanel}>
                <button
                    onClick={handleStartAddObject}
                    className={styles.controlButton}
                    disabled={isAddingMode && !isFormVisible}
                >
                    {"+"}
                </button>
                <AddObjSelectionForm
                    onObjSelected={handleObjSelection}
                    visible={selectionFormVisible}
                />
            </div>

            <MapWidget
                onMapClick={handleMapClick}
                isAddingMode={isAddingMode && !isFormVisible}
                selectedCoords={selectedCoords}
            />

            {isFormVisible && selectedCoords && selectedObjType && (
                <AddObjectForm
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    initialCoordinates={selectedCoords}
                    initialType={selectedObjType}
                />
            )}

        </div>
    );
};

export default MapPage;