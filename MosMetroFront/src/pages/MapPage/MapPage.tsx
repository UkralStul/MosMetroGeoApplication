import React, { useState, useCallback } from 'react';
import L from 'leaflet';
import MapWidget from '@/widgets/MapWidget/MapWidget';
import AddObjectForm from '@/widgets/AddObjectForm/AddObjectForm';
import { createUserObject } from '@/shared/api/objectsApi';
import { useUserObjectsStore } from '@/features/DisplayUserObjects/model/useUserObjectsStore';
import { UserObjectCreatePayload } from '@/entities/MapObject/model/types';
import styles from './MapPage.module.css';

const MapPage: React.FC = () => {
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const { addObject: addUserObjectToStore } = useUserObjectsStore();
    const [isAddingMode, setIsAddingMode] = useState(false);

    const handleMapClick = useCallback((latlng: L.LatLng) => {
        if (isAddingMode) {
            setSelectedCoords({ lat: latlng.lat, lng: latlng.lng });
            setIsFormVisible(true);
        }
    }, [isAddingMode]);

    const handleStartAddObject = () => {
        setIsAddingMode(true);
        setSelectedCoords(undefined);
        setIsFormVisible(false);
    };

    const handleFormSubmit = async (data: UserObjectCreatePayload) => {
        try {
            const newObject = await createUserObject(data);
            addUserObjectToStore(newObject);
            setIsFormVisible(false);
            setIsAddingMode(false);
            setSelectedCoords(undefined);
            console.log('Object created:', newObject);
        } catch (error) {
            console.error('Failed to create object:', error);
            alert('Ошибка при создании объекта. Подробности в консоли.');
            throw error;
        }
    };

    const handleFormCancel = () => {
        setIsFormVisible(false);
        setIsAddingMode(false);
        setSelectedCoords(undefined);
    };

    return (
        <div className={styles.mapPageContainer}>
            <div className={styles.controlsPanel}>
                <button
                    onClick={handleStartAddObject}
                    className={styles.controlButton}
                    disabled={isAddingMode && !isFormVisible}
                >
                    {isAddingMode && !isFormVisible ? "Выберите точку на карте..." : "Добавить объект"}
                </button>
            </div>

            <MapWidget
                onMapClick={handleMapClick}
                isAddingMode={isAddingMode && !isFormVisible}
            />

            {isFormVisible && selectedCoords && (
                <AddObjectForm
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    initialCoordinates={selectedCoords}
                />
            )}
        </div>
    );
};

export default MapPage;