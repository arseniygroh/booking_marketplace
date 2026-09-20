export interface User {
    name: string;
    email: string;
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