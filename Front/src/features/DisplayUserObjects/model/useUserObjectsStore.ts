import { create } from 'zustand';
import { UserObject } from '@/entities/MapObject/model/types';
import { fetchObjects, GeoObjectType } from '@/shared/api/objectsApi';

interface UserObjectsState {
    objectsByType: Record<GeoObjectType, UserObject[]>;
    isLoading: Record<GeoObjectType, boolean>;
    error: string | null;
    fetchObjectsByType: (type: GeoObjectType) => Promise<void>;
    addObject: (type: GeoObjectType, object: UserObject) => void;
    removeObject: (type: GeoObjectType, objectId: number) => void;
    updateObject: (type: GeoObjectType, updatedObject: UserObject) => void;
    updateCounter: number;
}

// Начальное состояние для всех типов объектов
const initialObjects: Record<GeoObjectType, UserObject[]> = {
    bus_stops: [],
    districts: [],
    stations: [],
    streets: [],
    custom_objects: [],
};

const initialLoading: Record<GeoObjectType, boolean> = {
    bus_stops: false,
    districts: false,
    stations: false,
    streets: false,
    custom_objects: false,
};


export const useUserObjectsStore = create<UserObjectsState>((set) => ({
    objectsByType: initialObjects,
    isLoading: initialLoading,
    error: null,
    updateCounter: 0,

    fetchObjectsByType: async (type: GeoObjectType) => {
        set(state => ({
            isLoading: { ...state.isLoading, [type]: true },
            error: null,
            updateCounter: state.updateCounter + 1,
        }));
        try {
            const data = await fetchObjects(type);
            set(state => {
                const newState = {
                    objectsByType: { ...state.objectsByType, [type]: data },
                    isLoading: { ...state.isLoading, [type]: false },
                    updateCounter: state.updateCounter + 1,
                };
                return newState;
            });
        } catch (err) {
            const error = err as Error;
            set(state => ({
                error: error.message || `Failed to fetch ${type}`,
                isLoading: { ...state.isLoading, [type]: false },
            }));
        }
    },

    addObject: (type, object) => set((state) => ({
        objectsByType: {
            ...state.objectsByType,
            [type]: [...state.objectsByType[type], object],
        }
    })),

    removeObject: (type, objectId) => set((state) => ({
        objectsByType: {
            ...state.objectsByType,
            [type]: state.objectsByType[type].filter(obj => obj.id !== objectId),
        }
    })),

    updateObject: (type, updatedObject) => set((state) => ({
        objectsByType: {
            ...state.objectsByType,
            [type]: state.objectsByType[type].map(obj => obj.id === updatedObject.id ? updatedObject : obj),
        }
    })),
}));