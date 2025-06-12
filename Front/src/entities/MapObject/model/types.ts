export interface GeometryPoint {
    type: "Point";
    coordinates: [number, number];
}

export interface UserObject {
    id: number;
    name: string;
    description?: string;
    object_type?: string;
    geometry: GeometryPoint;
    created_at: string;
    updated_at: string;
}

export interface UserObjectCreatePayload {
    name: string;
    description?: string;
    object_type?: string;
    geometry: GeometryPoint;
}


export interface GeoJsonFeature<G = any, P = any> {
    type: "Feature";
    geometry: G;
    properties: P;
}

// Тип для коллекции фич GeoJSON
export interface GeoJsonFeatureCollection<G = any, P = any> {
    type: "FeatureCollection";
    features: GeoJsonFeature<G, P>[];
}