import api from './instance';
// Общие типы
import { UserObject } from '@/entities/MapObject/model/types';

// Базовый эндпоинт
const API_BASE_ENDPOINT = 'v1/geo_objects';

// Типы для наших слоев, как на бэкенде
export type GeoObjectType = 'bus_stops' | 'districts' | 'stations' | 'streets' | 'custom_objects';

// Универсальные функции
export const fetchObjects = async (objectType: GeoObjectType): Promise<UserObject[]> => {
    const response = await api.get<UserObject[]>(`/${API_BASE_ENDPOINT}/${objectType}/`);
    return response.data;
};

export const createObject = async (objectType: GeoObjectType, data: any): Promise<UserObject> => {
    console.log('data', data);
    const response = await api.post<UserObject>(`/${API_BASE_ENDPOINT}/${objectType}/`, data);
    return response.data;
};

export const deleteObject = async (objectType: GeoObjectType, id: number): Promise<void> => {
    await api.delete(`/${API_BASE_ENDPOINT}/${objectType}/${id}/`);
};

export const updateObject = async (objectType: GeoObjectType, id: number, data: any): Promise<UserObject> => {
    const response = await api.put<UserObject>(`/${API_BASE_ENDPOINT}/${objectType}/${id}/`, data);
    return response.data;
};