import api from './instance';
import { UserObject, UserObjectCreatePayload } from '@/entities/MapObject/model/types';

export const fetchUserObjects = async (): Promise<UserObject[]> => {
    const response = await api.get<UserObject[]>('/objects/');
    return response.data;
};

export const createUserObject = async (data: UserObjectCreatePayload): Promise<UserObject> => {
    const response = await api.post<UserObject>('/objects/', data);
    return response.data;
};