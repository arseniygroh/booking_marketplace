"use client";

import { Property, Amenity } from "@/types";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import getCookie from "@/cookies";
import Image from "next/image";


export interface UnifiedImage {
    id?: number;         
    file: File | null;  
    previewUrl: string;
}

export default function PropertyForm({ propertyToEdit }: { propertyToEdit: Property | null }) {
    const [availableAmenities, setAvailableAmenities] = useState<Amenity[]>([]);  
    const [selectedAmenities, setSelectedAmenities] = useState<number[]>(
        propertyToEdit?.amenities ? propertyToEdit.amenities.map(a => a.id) : []
    );
    const [images, setImages] = useState<UnifiedImage[]>(
        propertyToEdit?.images 
            ? propertyToEdit.images.map(img => ({ 
                id: img.id, 
                file: null, 
                previewUrl: img.previewUrl
              })) 
            : []
    );
    
    const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(
        propertyToEdit?.primary_image_index ?? 0
    );
    
    const router = useRouter();

    useEffect(() => {
        const fetchAmenities = async () => {
            try {
                const response = await fetch("http://localhost:8000/amenities/");
                if (!response.ok) throw new Error("Failed to fetch amenities");
                
                const data: Amenity[] = await response.json();
                setAvailableAmenities(data);
            } catch (error) {
                console.error("Error fetching amenities:", error);
            }
        };
        fetchAmenities();
    }, []);

    const handleAmenityToggle = (id: number) => {
        setSelectedAmenities(prev => 
            prev.includes(id) 
                ? prev.filter(amenityId => amenityId !== id) 
                : [...prev, id]
        );
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const filesArray = Array.from(e.target.files);
        const newImages = filesArray.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }));
        setImages(prev => [...prev, ...newImages]);
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setImages(prev => {
            const imgToRemove = prev[indexToRemove];
            if (imgToRemove.file) {
                URL.revokeObjectURL(imgToRemove.previewUrl);
            }
            return prev.filter((_, idx) => idx !== indexToRemove);
        });
        if (primaryImageIndex === indexToRemove) {
            setPrimaryImageIndex(0);
        } else if (primaryImageIndex > indexToRemove) { 
            setPrimaryImageIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        
        selectedAmenities.forEach(id => {
            formData.append('amenities', id.toString());
        });
        
        let newImageUploadIndex = 0;
        let selectedNewPrimaryIndex = 0;

        images.forEach((img, currentIndex) => {
            if (img.file) {
                formData.append('images', img.file);

                if (currentIndex === primaryImageIndex) {
                    selectedNewPrimaryIndex = newImageUploadIndex;
                }
                newImageUploadIndex++;
            } else if (img.id) {
                formData.append('retained_image_ids', img.id.toString());
                if (currentIndex === primaryImageIndex) {
                    formData.append('primary_image_id', img.id.toString());
                }
            }
        });

        formData.append('primary_image_index', selectedNewPrimaryIndex.toString());
        
        const url = propertyToEdit 
            ? `http://localhost:8000/properties/${propertyToEdit.id}/update/` 
            : 'http://localhost:8000/properties/create/';
            
        const csrfToken = getCookie('csrftoken') || '';

        try {
            const res = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'X-CSRFToken': csrfToken 
                },
                body: formData, 
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to process property");
            
            alert(data.message || "Success!");
            router.push('/profile/properties');
            
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {propertyToEdit ? `Editing: ${propertyToEdit.title}` : "Create a New Property"}
            </h1>
            <p className="text-gray-500 text-lg mb-6">
                {propertyToEdit ? "Update your existing property details below." : "Fill out the form below to add a new property to your hosting portfolio."}
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Property Name</label>
                    <input required type="text" id="title" name="title" defaultValue={propertyToEdit?.title ?? ""} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="description" name="description" defaultValue={propertyToEdit?.description ?? ""} rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                </div>
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                    <input required type="text" id="location" name="location" defaultValue={propertyToEdit?.location ?? ""} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price per Night ($)</label>
                    <input step={0.1} required type="number" min={1} id="price" name="price" defaultValue={propertyToEdit?.price} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="maxGuests" className="block text-sm font-medium text-gray-700">Maximum Guests</label>
                    <input required type="number" min={1} id="maxGuests" name="max_guests" defaultValue={propertyToEdit?.max_guests} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {availableAmenities.map((amenity) => (
                            <label key={amenity.id} className="flex items-center space-x-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    checked={selectedAmenities.includes(amenity.id)}
                                    onChange={() => handleAmenityToggle(amenity.id)}
                                />
                                <span className="text-gray-700 text-sm group-hover:text-gray-900">{amenity.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Images</label>
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                    />
                    
                    {images.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {images.map((img, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setPrimaryImageIndex(idx)}
                                    className={`relative h-32 rounded-lg overflow-hidden cursor-pointer border-4 transition-all group ${
                                        primaryImageIndex === idx ? 'border-blue-600 shadow-md' : 'border-transparent hover:border-blue-300'
                                    }`}
                                >
                                    <Image
                                        src={img.previewUrl}
                                        alt={`Preview ${idx}`}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    {primaryImageIndex === idx && (
                                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                            Cover Image
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={e => {
                                            e.stopPropagation(); 
                                            handleRemoveImage(idx);
                                        }}
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-red-600 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors shadow-sm"
                                        title="Remove image"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="mt-2 text-xs text-gray-500">Click any image preview to set it as the cover.</p>
                </div>
                
                <div className="pt-4">
                    <button 
                        type="submit"
                        disabled={images.length === 0} 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {propertyToEdit ? "Save Changes" : "Publish Listing"}
                    </button>
                </div>
            </form>
        </div>
    );
}
