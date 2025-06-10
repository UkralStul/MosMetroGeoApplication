import React, { useState, useEffect } from 'react';
import { UserObjectCreatePayload } from '@/entities/MapObject/model/types';
import styles from './AddObjectForm.module.css';

interface AddObjectFormProps {
    onSubmit: (data: UserObjectCreatePayload) => Promise<void>; // Делаем onSubmit асинхронным
    onCancel: () => void;
    initialCoordinates?: { lat: number; lng: number };
}

const AddObjectForm: React.FC<AddObjectFormProps> = ({ onSubmit, onCancel, initialCoordinates }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [objectType, setObjectType] = useState('');
    const [latitude, setLatitude] = useState<string>(''); // Храним как строку для input
    const [longitude, setLongitude] = useState<string>(''); // Храним как строку для input
    const [isSubmitting, setIsSubmitting] = useState(false);


    useEffect(() => {
        if (initialCoordinates) {
            setLatitude(initialCoordinates.lat.toFixed(6));
            setLongitude(initialCoordinates.lng.toFixed(6));
        } else {
            setLatitude('');
            setLongitude('');
        }
    }, [initialCoordinates]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || latitude === '' || longitude === '') {
            alert('Пожалуйста, заполните название объекта и выберите точку на карте.');
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                name: name.trim(),
                description: description.trim(),
                object_type: objectType.trim(),
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
            });
            // Очистка формы или закрытие модального окна произойдет в родительском компоненте MapPage
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Произошла ошибка при сохранении объекта. Попробуйте еще раз.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.formOverlay}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <h3>Добавить новый объект</h3>
                <div className={styles.formGroup}>
                    <label htmlFor="object-name">Название:</label>
                    <input type="text" id="object-name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting}/>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="object-description">Описание:</label>
                    <textarea id="object-description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSubmitting}/>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="object-type">Тип объекта:</label>
                    <input type="text" id="object-type" value={objectType} onChange={(e) => setObjectType(e.target.value)} placeholder="Например, Кафе, Памятник" disabled={isSubmitting}/>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="object-latitude">Широта:</label>
                    <input type="number" id="object-latitude" value={latitude} step="any" required readOnly disabled={isSubmitting}/>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="object-longitude">Долгота:</label>
                    <input type="number" id="object-longitude" value={longitude} step="any" required readOnly disabled={isSubmitting}/>
                </div>
                {!initialCoordinates && <p className={styles.hint}>Кликните на карту, чтобы выбрать координаты.</p>}

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