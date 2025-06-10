import { create } from 'zustand';
import { UserObject } from '@/entities/MapObject/model/types';
import { fetchUserObjects } from '@/shared/api/objectsApi';

interface UserObjectsState {
    objects: UserObject[];
    isLoading: boolean;
    error: string | null;
    fetchObjects: () => Promise<void>;
    addObject: (object: UserObject) => void;
}

export const useUserObjectsStore = create<UserObjectsState>((set) => ({
    objects: [],
    isLoading: false,
    error: null,
    fetchObjects: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await fetchUserObjects();
            set({ objects: data, isLoading: false });
        } catch (err) {
            const error = err as Error;
            set({ error: error.message || 'Failed to fetch user objects', isLoading: false });
        }
    },
    addObject: (object) => set((state) => ({ objects: [...state.objects, object] })),
}));