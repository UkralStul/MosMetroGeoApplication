import React from 'react';
import styles from './AddObjSelectionForm.module.css';
import {GeoObjectType} from "@/shared/api/objectsApi.ts";
interface AddObjSelectionFormProps {
    onObjSelected: (objType: GeoObjectType) => void,
    visible: boolean,
}

const AddObjSelectionForm: React.FC<AddObjSelectionFormProps> = ({ onObjSelected, visible }) => {
    return (
        <div className={`${styles.formContainer} ${visible ? styles.show : ''}`}>
            <button
                onClick={() => onObjSelected('bus_stops')}
                className={styles.button}
            >Автобусная остановка</button>
            <button
                onClick={() => onObjSelected('stations')}
                className={styles.button}
            >Станция</button>
            <button
                onClick={() => onObjSelected('streets')}
                className={styles.button}
            >Улица</button>
            <button
                onClick={() => onObjSelected('districts')}
                className={styles.button}
            >Район</button>
        </div>
    )
}

export default AddObjSelectionForm;