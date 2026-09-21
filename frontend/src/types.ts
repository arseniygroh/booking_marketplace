export interface User {
    id: number;
    name: string;
    email: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
}
  
export interface Property {
    id: number;
    title: string;
    description: null | string;
    amenities: string[] | null;
    location: string;
    max_guests: number;
    primary_image: null | string;
    price: string;
    owner: User;
    images_urls: string[] | null;
}