export interface User {
    id: number;
    username: string;
    email: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
}

export interface FormState {
    success: boolean | null;
    message: string;
    user: User | null;
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
    created_at: string;
}

export interface Booking extends Omit<Property, 'amenities' | 'owner' | 'price' | 'images_urls' | 'max_guests'> {
    booking_id: number;
    check_in: string;
    check_out: string;
    created_at: string;
    total_price: string;
    status: string;
}