import React, { useEffect, useState } from 'react';
import styles from './ObjectInfoSidebar.module.css';

export type ObjectProperties = Record<string, any>;


interface ObjectInfoSidebarProps {
    properties: ObjectProperties | null;
    onClose: () => void;
}

const ObjectInfoSidebar: React.FC<ObjectInfoSidebarProps> = ({ properties, onClose }) => {
    const [displayProperties, setDisplayProperties] = useState<ObjectProperties | null>(null);

    const [isShowing, setIsShowing] = useState(false);

    useEffect(() => {
        if (properties) {
            setDisplayProperties(properties);

            const timer = setTimeout(() => {
                setIsShowing(true);
            }, 10);

            return () => clearTimeout(timer);

        } else {
            setIsShowing(false);

            const timer = setTimeout(() => {
                setDisplayProperties(null);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [properties]);

    if (!displayProperties) {
        return null;
    }

    const objectName =
        displayProperties.name ||
        displayProperties.NAME ||
        displayProperties.name_mpv ||
        displayProperties.name_station ||
        displayProperties.ST_NAME ||
        "Детали объекта";

    // Фильтруем свойства, чтобы не показывать пользователю служебные поля
    const fieldsToDisplay = Object.entries(displayProperties).filter(([key]) =>
        !['fid', 'id', 'geometry', 'properties_data', 'created_at', 'updated_at', 'icon'].includes(key)
    );

    return (
        <div className={`${styles.sidebar} ${isShowing ? styles.show : ''}`}>
            <div className={styles.header}>
                <h3 title={objectName}>{objectName}</h3>
                <button onClick={onClose} className={styles.closeButton} title="Закрыть">×</button>
            </div>
            <div className={styles.content}>
                <table>
                    <tbody>
                    {fieldsToDisplay.map(([key, value]) => (
                        <tr key={key}>
                            <td className={styles.key}>{key.replace(/_/g, ' ')}</td>
                            <td className={styles.value}>{String(value ?? 'нет данных')}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ObjectInfoSidebar;