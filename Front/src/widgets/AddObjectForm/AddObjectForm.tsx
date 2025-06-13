// src/widgets/AddObjectForm/AddObjectForm.tsx

import React, {useEffect, useState} from 'react';
import { GeoObjectType } from '@/shared/api/objectsApi';
import styles from './AddObjectForm.module.css';

// Определяем, какие поля нужны для каждого типа объекта
const OBJECT_FIELDS: Record<GeoObjectType, string[]> = {
    bus_stops: ['name_mpv', 'rayon', 'ao', 'marshrut'],
    districts: ['name', 'name_ao'],
    stations: ['name_station', 'name_line', 'station_type'],
    streets: ['id', 'st_name', 'road_categ'], // 'id' здесь - это EdgeId
    custom_objects: ['name', 'description', 'object_type'],
};

// Русские названия для полей
const FIELD_LABELS: Record<string, string> = {
    name_mpv: 'Название остановки',
    rayon: 'Район',
    ao: 'Административный округ',
    marshrut: 'Маршруты',
    name: 'Название',
    name_ao: 'Название округа',
    name_station: 'Название станции',
    name_line: 'Линия',
    st_name: 'Название улицы',
    road_categ: 'Категория дороги',
    description: 'Описание',
    object_type: 'Тип объекта',
};

interface AddObjectFormProps {
    onSubmit: (objectType: GeoObjectType, data: any) => Promise<void>;
    onCancel: () => void;
    initialCoordinates: { lat: number; lng: number }[];
    initialType: GeoObjectType;
}

const AddObjectForm: React.FC<AddObjectFormProps> = ({ onSubmit, onCancel, initialCoordinates, initialType }) => {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stationType, setStationType] = useState<'М' | 'Наземная'>('М');


    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        setFormData({});
        setStationType('М');
    }, [initialType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        let geometryType: string;
        let formattedCoordinates: any;

        switch (initialType) {
            case 'bus_stops':
            case 'stations':
            case 'custom_objects': { // <-- Открывающая скобка
                geometryType = 'Point';
                formattedCoordinates = [initialCoordinates[0].lng, initialCoordinates[0].lat];
                break;
            } // <-- Закрывающая скобка

            case 'streets': { // <-- Открывающая скобка
                geometryType = 'MultiLineString';
                formattedCoordinates = [
                    initialCoordinates.map(coord => [coord.lng, coord.lat])
                ];
                break;
            } // <-- Закрывающая скобка

            case 'districts': { // <-- Открывающая скобка
                geometryType = 'Polygon';
                // Здесь мы объявляем новую переменную, поэтому блок обязателен
                const polygonRing = initialCoordinates.map(coord => [coord.lng, coord.lat]);
                if (polygonRing.length > 0 && (polygonRing[0][0] !== polygonRing[polygonRing.length - 1][0] || polygonRing[0][1] !== polygonRing[polygonRing.length - 1][1])) {
                    polygonRing.push(polygonRing[0]);
                }
                formattedCoordinates = [polygonRing];
                break;
            } // <-- Закрывающая скобка

            default: { // <-- Хорошая практика - оборачивать и default
                alert(`Неизвестный тип объекта для создания геометрии: ${initialType}`);
                setIsSubmitting(false);
                return;
            }
        }

        const payload = {
            ...formData,
            geometry: {
                type: geometryType,
                coordinates: formattedCoordinates
            }
        };

        if (initialType === 'stations') {
            (payload as any).type = stationType;
        }

        if ('id' in payload && typeof payload.id === 'string') {
            const parsedId = parseInt(payload.id, 10);
            if (!isNaN(parsedId)) {
                payload.id = parsedId;
            } else {
                alert('ID (EdgeId) должен быть числом.');
                setIsSubmitting(false);
                return;
            }
        }

        try {
            await onSubmit(initialType, payload);
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const fieldsToRender = OBJECT_FIELDS[initialType].filter(field => {
        if (initialType === 'stations' && field === 'station_type') {
            return false;
        }

        if (initialType === 'streets' && field === 'id') {
            return false;
        }

        return true;
    });


    return (
        <div className={styles.formOverlay}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <h3>Добавить новый объект</h3>

                {initialType === 'stations' && (
                    <div className={styles.formGroup}>
                        <label>Тип станции:</label>
                        <div className={styles.radioGroup}>
                            <label>
                                <input
                                    type="radio"
                                    name="stationType"
                                    value="М"
                                    checked={stationType === 'М'}
                                    onChange={() => setStationType('М')}
                                />
                                Метро
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="stationType"
                                    value="Наземная"
                                    checked={stationType === 'Наземная'}
                                    onChange={() => setStationType('Наземная')}
                                />
                                Наземная (МЦК/МЦД)
                            </label>
                        </div>
                    </div>
                )}

                {fieldsToRender.map(field => (
                    <div className={styles.formGroup} key={field}>
                        <label htmlFor={`field-${field}`}>{FIELD_LABELS[field] || field}:</label>
                        <input
                            type={field === 'id' ? 'number' : 'text'}
                            id={`field-${field}`}
                            value={formData[field] || ''}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            required={!['description', 'object_type'].includes(field)} // Пример необязательных полей
                            disabled={isSubmitting}
                        />
                    </div>
                ))}

                <div className={styles.buttons}>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button type="button" onClick={onCancel} disabled={isSubmitting}>Отмена</button>
                </div>
            </form>
        </div>
    );
};

export default AddObjectForm;